import asyncio
import ipaddress
import logging
import platform
import re
import socket
import subprocess

logger = logging.getLogger(__name__)


def _detect_local_subnets() -> list[str]:
    """Auto-detect local network interfaces and their subnets."""
    subnets = []
    try:
        import netifaces
        for iface in netifaces.interfaces():
            addrs = netifaces.ifaddresses(iface)
            if netifaces.AF_INET in addrs:
                for addr_info in addrs[netifaces.AF_INET]:
                    ip = addr_info.get("addr")
                    netmask = addr_info.get("netmask")
                    if ip and netmask and not ip.startswith("127."):
                        network = ipaddress.ip_network(f"{ip}/{netmask}", strict=False)
                        subnets.append(str(network))
    except ImportError:
        logger.warning("netifaces not installed, falling back to default subnet detection")
        subnets = _fallback_subnet_detection()
    return subnets


def _fallback_subnet_detection() -> list[str]:
    """Detect subnets without netifaces by parsing ifconfig/ip output."""
    subnets = []
    try:
        if platform.system() == "Darwin":
            output = subprocess.check_output(["ifconfig"], text=True)
            for line in output.split("\n"):
                line = line.strip()
                if line.startswith("inet ") and "127.0.0.1" not in line:
                    parts = line.split()
                    ip = parts[1]
                    mask_idx = parts.index("netmask") + 1 if "netmask" in parts else -1
                    if mask_idx > 0:
                        hex_mask = parts[mask_idx]
                        mask_int = int(hex_mask, 16)
                        netmask = str(ipaddress.ip_address(mask_int))
                        network = ipaddress.ip_network(f"{ip}/{netmask}", strict=False)
                        subnets.append(str(network))
        else:
            output = subprocess.check_output(["ip", "-4", "addr"], text=True)
            for match in re.finditer(r"inet\s+(\d+\.\d+\.\d+\.\d+/\d+)", output):
                cidr = match.group(1)
                if not cidr.startswith("127."):
                    network = ipaddress.ip_network(cidr, strict=False)
                    subnets.append(str(network))
    except Exception as e:
        logger.error("Fallback subnet detection failed: %s", e)
    return subnets or ["192.168.1.0/24"]


def detect_subnets() -> list[str]:
    return _detect_local_subnets()


def _resolve_hostname(ip: str) -> str | None:
    try:
        return socket.gethostbyaddr(ip)[0]
    except (socket.herror, socket.gaierror, OSError):
        return None


def _lookup_vendor(mac: str) -> str | None:
    try:
        from mac_vendor_lookup import MacLookup
        return MacLookup().lookup(mac)
    except Exception:
        return None


async def arp_scan(subnet: str, timeout: int = 3) -> list[dict]:
    """ARP scan using scapy. Requires root/sudo."""
    try:
        from scapy.all import ARP, Ether, srp
    except ImportError:
        logger.warning("scapy not installed, falling back to ping sweep")
        return await ping_sweep(subnet, timeout)

    def _do_scan():
        arp = ARP(pdst=str(subnet))
        ether = Ether(dst="ff:ff:ff:ff:ff:ff")
        packet = ether / arp
        answered, _ = srp(packet, timeout=timeout, verbose=False)
        devices = []
        for _, received in answered:
            ip = received.psrc
            mac = received.hwsrc.upper()
            devices.append({
                "ip_address": ip,
                "mac_address": mac,
                "hostname": _resolve_hostname(ip),
                "vendor": _lookup_vendor(mac),
            })
        return devices

    loop = asyncio.get_event_loop()
    try:
        return await loop.run_in_executor(None, _do_scan)
    except PermissionError:
        logger.warning("ARP scan requires root, falling back to ping sweep")
        return await ping_sweep(subnet, timeout)


async def _get_mac_from_arp_cache(ip: str) -> str | None:
    """Read MAC from OS ARP cache."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "arp", "-n", ip,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )
        stdout, _ = await proc.communicate()
        output = stdout.decode()
        match = re.search(r"([\da-fA-F]{1,2}[:-]){5}[\da-fA-F]{1,2}", output)
        if match:
            return match.group(0).upper().replace("-", ":")
    except Exception:
        pass
    return None


async def ping_sweep(subnet: str, timeout: int = 1) -> list[dict]:
    """Fallback: ping each IP in the subnet concurrently."""
    network = ipaddress.ip_network(subnet, strict=False)
    hosts = list(network.hosts())

    # Limit concurrency to avoid overwhelming the system
    semaphore = asyncio.Semaphore(50)

    async def ping_host(ip: str) -> dict | None:
        async with semaphore:
            ping_cmd = ["ping", "-c", "1", "-W", str(timeout)]
            if platform.system() != "Darwin":
                ping_cmd = ["ping", "-c", "1", "-W", str(timeout)]
            ping_cmd.append(ip)

            proc = await asyncio.create_subprocess_exec(
                *ping_cmd,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
            await proc.wait()
            if proc.returncode == 0:
                mac = await _get_mac_from_arp_cache(ip)
                hostname = _resolve_hostname(ip)
                vendor = _lookup_vendor(mac) if mac else None
                return {
                    "ip_address": ip,
                    "mac_address": mac or "unknown",
                    "hostname": hostname,
                    "vendor": vendor,
                }
            return None

    tasks = [ping_host(str(ip)) for ip in hosts]
    results = await asyncio.gather(*tasks)
    return [r for r in results if r is not None]


async def scan_network(subnet: str, timeout: int = 3) -> tuple[list[dict], str]:
    """Try ARP scan first, fall back to ping sweep. Returns (devices, method)."""
    try:
        devices = await arp_scan(subnet, timeout)
        return devices, "arp"
    except Exception as e:
        logger.warning("ARP scan failed for %s: %s, trying ping sweep", subnet, e)
    devices = await ping_sweep(subnet, timeout)
    return devices, "ping"
