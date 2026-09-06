# DNS Toggle

## A lightweight Android Quick Settings Toggle for Private DNS

> [!SUMMARY]
>
> |               |                               |
> | ------------- | ----------------------------- |
> | **Platform**  | Android                       |
> | **Languages** | Kotlin                        |
> | **Skillset**  | App Development, UI/UX Design |
>
> - 📥 [Download from F-Droid](https://f-droid.org/packages/com.ericlowry.dnstoggle/)
> - 📥 [Download from IzzyOnDroid](https://apt.izzysoft.de/fdroid/index/apk/com.ericlowry.dnstoggle)
> - 📦 [Download from GitHub](https://github.com/ELowry/DNSToggle/releases/latest)
> - 🗎 [Source code on GitHub](https://github.com/ELowry/DNSToggle)
>
> **License:** MIT

Since Android 9, it has been possible to use the _private DNS_ setting on devices to set a custom DNS server; coupled with services like [NextDNS](https://nextdns.io/), it is one of the easiest ways of enabling system-wide tracking protection and malware/content blocking.  
This is a great security baseline across the Android ecosystem, but it can interfere with some networks (public access points or Hotel wireless networks), which can make it impractical to use as it is buried in the system settings.

![DNS Toggle app logo](/assets/images/osd/dns-toggle/logo__240-117-webp_240-117_400-196-webp_400-196_600-294-webp_600-294_820-401-webp_820-401_1024-501-webp_1024-501.png)

Though this is not the first attempt to develop and implement a more practical way to toggle this option (and likely not the most advanced), my aim was to set up an extremely lightweight toggle for _private DNS_ in the Android quick settings menu myself as a means to learn the basics of Android app development.

<!-- prettier-ignore -->
| Gallery |  |  |  |
| -- | -- | -- | -- |
| ![Screenshot of the Private DNS hostname quick-switch popup](/assets/images/osd/dns-toggle/screen1__240-539-webp_240-539_400-898-webp_400-898_600-1347-webp_600-1347_820-1840-webp_820-1840_855-1919-webp_855-1919.jpg) | ![Screenshot of the Private DNS Quick Settings tile and optional feature notifications](/assets/images/osd/dns-toggle/screen2__240-539-webp_240-539_400-898-webp_400-898_600-1347-webp_600-1347_820-1840-webp_820-1840_855-1919-webp_855-1919.jpg) | ![Screenshot of the DNS Toggle configuration menu](/assets/images/osd/dns-toggle/screen3__240-539-webp_240-539_400-898-webp_400-898_600-1347-webp_600-1347_820-1840-webp_820-1840_855-1919-webp_855-1919.jpg) | ![Screenshot of the second half of the DNS Toggle configuration menu](/assets/images/osd/dns-toggle/screen4__240-539-webp_240-539_400-898-webp_400-898_600-1347-webp_600-1347_820-1840-webp_820-1840_855-1919-webp_855-1919.jpg) |

<!-- prettier-ignore end -->

Over the course of a few days, I coded the initial app, designed its logo, and submitted it to F-Droid to make it more easily available. Since then, it has evolved into a more capable tool allowing you to fully automate your private DNS directly from the quick settings panel.

### UX & Requirements

To keep the user experience as frictionless and lightweight as possible, I designed the app to be effectively "invisible" by offering an option to hide the app from your launcher drawer. Instead, everything is managed directly from the quick settings panel: a single tap toggles _private DNS_, and a long-press opens a configuration menu. From there, users can save multiple custom DNS provider hostnames, rename the tile label, or set up automation rules to disable or override the DNS on specific Wi-Fi networks (SSID filtering) or active VPNs. It also supports securely backing up and restoring your configurations via password-encrypted files.

Because this relies on changing a protected system setting, the app requires the `WRITE_SECURE_SETTINGS` permission to function, which must be granted via root, Shizuku, or manually through an ADB command.
