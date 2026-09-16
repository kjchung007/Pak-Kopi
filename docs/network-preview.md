# Phone preview over Wi-Fi

For a persistent Windows phone preview, run `powershell -File scripts/start-network-preview.ps1`. It starts the suite in hidden background processes and writes startup logs into artifacts/network-server.log. The original `node scripts/start-apps.mjs` runs in the foreground and stops being available if its command session or process is terminated.

The website (3000) and customer ordering app (5173) listen on the local network. Admin and staff remain bound to loopback. Keep the computer running and connect the phone to the same Wi-Fi.

Current addresses, checked 13 September 2026:

- Website: http://192.168.0.148:3000/
- Ordering: http://192.168.0.148:5173/

The computer's DHCP address can change; use the Network address printed by the launcher. Do not use localhost on the phone. Cross-app customer links preserve the hostname the visitor opened. Next dev origins are derived from the computer's current IPv4 interfaces. Existing Windows Node firewall rules allow inbound access on the active public profile; no firewall rules were changed.

Website redirects have a 3-second timeout, and content requests have a 6-second timeout before the existing fallback behaviour. Static images, fonts and framework assets skip the redirect lookup so they are not delayed by database availability.

Verified with a browser against the Wi-Fi address at 390px and 1440px: all four website routes, ordering links, branch selection and live menu loading. This is not confirmation of connectivity from a separate physical phone; that depends on its Wi-Fi connection and router isolation settings.

Later diagnosis: when the phone again showed a blank page, neither port 3000 nor 5173 had a listener. Both servers were relaunched as detached background processes. HTTP load checks then completed with status 200 in approximately 1.8 seconds (website) and 3.4 seconds (ordering), without JavaScript errors. Keep the computer awake; this local preview is not an always-on hosted deployment.
