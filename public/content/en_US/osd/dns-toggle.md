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
> - ⏱ Pending availability on F-Droid
> - 📦 [Download on GitHub](https://github.com/ELowry/DNSToggle/releases)
> - 🗎 [Source code on GitHub](https://github.com/ELowry/DNSToggle)
>
> **License:** MIT

Since Android 9, it has been possible to use the _private DNS_ setting on devices to set a custom DNS server; coupled with services like [NextDNS](https://nextdns.io/), it is one of the easiest ways of enabling system-wide tracking protection and malware/content blocking.  
This is a great security baseline across the Android ecosystem, but it can interfere with some networks (public access points or Hotel wireless networks), which can make it impractical to use as it is buried in the system settings.

![DNS Toggle app logo](/assets/images/osd/dns-toggle/logo__240-117-webp_240-117_400-196-webp_400-196_600-294-webp_600-294_820-401-webp_820-401_1024-501-webp_1024-501.png)

Though this is not the first attempt to make toggling the option more practical, and likely not the most advanced, my aim was to set up an extremely lightweight toggle for _private DNS_ in the Android quick settings menu myself as a means to learn the basics of Android app development.

<!-- prettier-ignore -->
| Gallery |  |  |  |
| -- | -- | -- | -- |
| ![Screenshot of Private DNS being toggled on in the Quick Settings menu](/assets/images/osd/dns-toggle/screen1__240-534-webp_240-534_400-889-webp_400-889_600-1334-webp_600-1334_820-1823-webp_820-1823_1220-2712-webp_1220-2712.jpg) | ![Screenshot of Private DNS being toggled off in the Quick Settings menu](/assets/images/osd/dns-toggle/screen2__240-534-webp_240-534_400-889-webp_400-889_600-1334-webp_600-1334_820-1823-webp_820-1823_1220-2712-webp_1220-2712.jpg) | ![Screenshot of the DNS Toggle configuration menu](/assets/images/osd/dns-toggle/screen3__240-534-webp_240-534_400-889-webp_400-889_600-1334-webp_600-1334_820-1823-webp_820-1823_1220-2712-webp_1220-2712.jpg) | ![Screenshot of the DNS Toggle configuration menu's rename popup](/assets/images/osd/dns-toggle/screen4__240-534-webp_240-534_400-889-webp_400-889_600-1334-webp_600-1334_820-1823-webp_820-1823_1220-2712-webp_1220-2712.jpg) |

<!-- prettier-ignore end -->

Over the course of a few days, I coded the app, designed its logo, and submitted it to F-Droid to make it more easily available.

### UX & Requirements

To keep the user experience as frictionless and lightweight as possible, I designed the app to be effectively "invisible". It does not create an icon in the device's app drawer. Instead, everything is managed directly from the quick settings panel: a single tap toggles _private DNS_, and a long-press opens a minimal configuration menu where users can input custom DNS provider hostnames or rename the tile label.

Because this relies on changing a protected system setting, the app requires the `WRITE_SECURE_SETTINGS` permission to function, which must be granted via root or manually through an ADB command.
