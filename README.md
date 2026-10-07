# Eskişehir Boya Badana — eskisehirboyabadana.com

Eskişehir'in 14 ilçesinde boya badana, dekoratif boya, kapı / seramik / mobilya boyama,
boya tadilatı ve **acil boyacı** hizmetini tanıtan; ziyaretçiyi **Hızlı Teklif** formuna,
telefona ve WhatsApp'a yönlendiren SEO/GEO odaklı site.

**Düz HTML + htmx.** Derleme adımı, Node.js, npm yok. Dosyaları olduğu gibi sunucuya atınca çalışır.

---

## Yayına almadan önce kontrol edin

Neredeyse her şey tek dosyada: **`data/db.json`**. Düzenleyip kaydetmeniz yeterli —
sayfa açıldığında butonlar, linkler, teklif formu seçenekleri ve WhatsApp mesajları güncellenir.

| Alan | Şu anki değer / ne yazılacak |
|---|---|
| `contact.phone` | `+905332069474` (uluslararası biçim) |
| `contact.phoneDisplay` | `0533 206 94 74` (ekranda görünen) |
| `contact.whatsapp` | `905332069474` (başında `+` ve boşluk olmadan) |
| `contact.email` | `info@eskisehirboyabadana.com` — **bu adresin gerçekten açılmış olması gerekir** |
| `sosyal.instagram` | `https://www.instagram.com/eskisehir.boyabadana/` (QR linkindeki izleme parametreleri temizlendi) |
| `sosyal.facebook`, `sosyal.googleIsletme` | Boş olanlar sitede gösterilmez |
| `address.goster` | `false` — adres hiçbir yerde görünmez (hizmet bölgesi işletmesi). Adres eklemek isterseniz `streetAddress`'i doldurup `true` yapın |
| `calisma.surekliAcik` | `true` — "Şu anda çevrimiçi" rozeti hep yeşil. `false` yaparsanız `calisma.saatler`'e göre hesaplanır |
| `takip.*` | **Boş** — hiçbir izleme kodu yüklenmez. Google Ads / GA4 kimliklerini yazınca otomatik devreye girer |

### Teyit edilmesi gereken iddialar

Aşağıdakiler sitede metin olarak geçiyor. Doğru değilse söyleyin ya da düzeltin:

- **12 ay işçilik garantisi** — `bilgi.garantiAy`. Boş bırakılırsa hero ve güven şeridindeki
  garanti ifadeleri gizlenir; ancak **SSS metninde** ve `llms.txt`'de de geçiyor, oralardan da silinmeli.
- **Faturalı çalışma, nakit + kredi kartı** — SSS'de ve `llms.txt`'de geçiyor.
- **Ortalama süreler** (1+1: 1 gün, 3+1: 2–3 gün, kapı 1–2 gün, mutfak dolabı 2–3 gün, acil 24–48 saat)
  — ana sayfadaki tabloda ve hizmet sayfalarında. Kendi tecrübenize göre güncelleyin.
- **Merkez ilçelerde aynı gün keşif** — ilçe sekmelerinde ve SSS'de.

---

## Hızlı Teklif nasıl çalışır?

1. Form, `partials/teklif-formu.html` dosyasından **htmx** ile her sayfaya yüklenir (tek kaynak).
2. Seçenek grupları (`hizmet`, `konut`, `kapsam`, `evDurumu`, `renk`, `boya`, `zamanlama`) ve
   hizmete göre açılan ek alanlar (kapı adedi, mobilya listesi, dekoratif teknik…) **`db.json → teklif`**
   bölümünden üretilir. Yeni bir konut tipi ya da seçenek eklemek için yalnızca JSON'u düzenleyin.
   - `kosul`: grubun hangi hizmet(ler) seçilince görüneceği.
   - `detay`: seçilince açılan serbest metin kutusu (ör. "Özel ölçü" → m² / açıklama).
   - `acil: true`: seçilince önizlemede kırmızı "Acil talep" bandı ve mesajda "🚨 ACİL TALEP" etiketi.
3. Sağda **canlı teklif önizlemesi** (teklif no, tarih, tüm seçimler) ve WhatsApp'a gidecek mesaj görünür.
4. **Telefon zorunlu**, en az bir hizmet ve konut tipi zorunlu. "Teklif Ver"e basılınca WhatsApp
   hazır mesajla açılır; ekranda "size özel indirimli fiyat teklifiniz WhatsApp'tan iletilecek" yazar.
5. **Fiyat gösterilmez.** Form verileri sitede veya bir sunucuda **saklanmaz**; yalnızca kullanıcının
   gönderdiği WhatsApp mesajıyla size ulaşır (KVKK metni buna göre yazıldı).

Hizmet sayfalarında form o hizmet **ön seçili** gelir. Reklam linklerinde `?hizmet=kapi-boyama`
gibi bir parametreyle de ön seçim yapılabilir.

---

## Dosya yapısı

```
index.html                      ana sayfa (hero, hizmetler, hızlı teklif, Instagram, ilçeler, SSS, iletişim)
boya-badana/  dekoratif-boya/  kapi-boyama/  seramik-boyama/
mobilya-boyama/  tadilat/  acil-boyaci/          ► her biri ayrı SEO sayfası (index.html)
gizlilik-politikasi/  kvkk-aydinlatma-metni/  404.html
data/db.json                    ► DÜZENLENECEK ANA DOSYA
partials/teklif-formu.html      htmx ile yüklenen teklif formu
assets/css/style.css            renkler logodan: lacivert #132534, turuncu #fdab37 → #ea5a12
assets/js/app.js                db.json okuma, teklif formu, çevrimiçi rozeti, ilçe sekmeleri, dönüşüm takibi
assets/js/htmx.min.js           htmx 2.0.10
assets/fonts/inter-var.woff2
assets/img/                     logo, logo-mark (header), og.jpg, favicon, ikonlar
robots.txt · sitemap.xml · llms.txt · site.webmanifest · _headers
kaynak/                         logonun orijinali (siteye dahil değil)
```

Header, footer ve ikon seti 11 sayfada aynıdır; ortak bir parçayı değiştirirseniz
(ör. menüye link eklemek) tüm sayfalarda aynı değişikliği yapın.

---

## Yerelde çalıştırma

Yollar kök-mutlak (`/assets/...`) olduğu için dosyayı çift tıklamak yerine **proje kökünde** sunucu açın:

```bash
python3 -m http.server 8000
# tarayıcıda: http://localhost:8000
```

---

## Cloudflare Pages'e yayınlama

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**
   (ya da GitHub reposunu bağlayın).
2. **Build command boş**, build output directory `/`.
3. **Custom domains**: `eskisehirboyabadana.com` ve `www.eskisehirboyabadana.com`.
4. SSL/TLS → **Full (strict)**, "Always Use HTTPS" açık.

`_headers` önbellek ve güvenlik başlıklarını uygular; `/partials/` ve `/data/` klasörlerine `noindex` verir.
`404.html` Cloudflare Pages tarafından otomatik kullanılır.

---

## Google Ads & Analytics (isteğe bağlı)

`db.json → takip` alanlarını doldurun:

- `googleAdsId` (`AW-XXXXXXXXX`), `ga4Id` (`G-XXXXXXXXXX`)
- `aramaDonusumEtiketi`, `whatsappDonusumEtiketi`, `teklifDonusumEtiketi`

Etiketler dolunca `tel:` tıklamaları, WhatsApp tıklamaları ve **teklif gönderimleri** ayrı dönüşüm
olarak sayılır; GA4'e `telefon_tikla`, `whatsapp_tikla`, `teklif_gonder` olayları gider.
Reklam linkine `?utm_source=google` eklenirse WhatsApp mesajına "(Google)" notu düşer.

---

## SEO / GEO

- Her sayfada benzersiz başlık/açıklama (Google kesme sınırı içinde), canonical, Open Graph, `geo.*` etiketleri.
- Ana sayfa: `HousePainter` (LocalBusiness alt tipi) + `WebSite` + `WebPage` + `FAQPage` (12 soru);
  14 ilçe `areaServed`, 7 hizmet `hasOfferCatalog`, Instagram `sameAs`.
- Hizmet sayfaları: `Service` + `BreadcrumbList` + `FAQPage` + `WebPage`, görünür breadcrumb,
  "Fiyatı neler belirler", uygulama adımları ve konuya özel bilgi bölümleri (yapay zekâ arama motorlarının
  alıntılayabileceği net cevaplar).
- `llms.txt`: işletmenin yapay zekâ asistanlarınca doğru özetlenmesi için künye ve hizmet özeti.
- `robots.txt`: GPTBot, ClaudeBot, PerplexityBot, Google-Extended gibi AI tarayıcılarına açık.

### Yayından sonra yapılacaklar

1. **Google İşletme Profili** açın — "hizmet bölgesi işletmesi" seçip adresi gizleyin, 14 ilçeyi ekleyin.
   Linki `sosyal.googleIsletme`'ye yazın.
2. **Search Console**'a siteyi ekleyip `sitemap.xml` gönderin; doğrulama kodunu gerekirse `<head>`'e ekleyin.
3. Instagram biyografisine `eskisehirboyabadana.com` linkini koyun.
4. Google Rich Results Test ile ana sayfa ve bir hizmet sayfasını kontrol edin.

---

## Bilinçli olarak yapılmayanlar

- **Sahte yorum / yıldız puanı yok.** Uydurma `AggregateRating` Google'ın yapısal veri politikasına aykırıdır.
  Gerçek Google yorumları biriktiğinde yorum bölümü eklenebilir.
- **Sabit fiyat yok.** İstek doğrultusunda fiyat yalnızca WhatsApp'tan, indirimli olarak iletilir.
- **Stok fotoğraf yok.** Instagram bölümünde gerçek iş fotoğrafı yerine renk paleti kartları var;
  kendi önce/sonra fotoğraflarınız olduğunda bu alan galeriye çevrilebilir.
- **Uzak ilçelerde mahalle listesi yok.** Yalnızca merkez ilçelerin bilinen mahalleleri listelendi;
  doğrulanmamış köy isimleri yerel SEO'ya zarar verir.
- Yasal metinler (gizlilik, KVKK) genel şablondur; bir hukukçuya gözden geçirtmekte fayda var.
