/* ==========================================================================
   Eskişehir Boya Badana — site davranışları
   Tüm iletişim bilgisi ve Hızlı Teklif seçenekleri data/db.json'dan okunur;
   HTML'deki değerler yalnızca yedektir (JSON okunamazsa sayfa yine çalışır).
   ========================================================================== */
(function () {
  'use strict';

  var TZ = 'Europe/Istanbul';
  var DB_URL = '/data/db.json';
  var cfg = null;
  var cfgHata = false;
  var seciliIlce = 'Eskişehir';

  /* ---------------------------------------------------------- yardımcılar */

  function $(sel, kok) { return (kok || document).querySelector(sel); }
  function $$(sel, kok) { return Array.prototype.slice.call((kok || document).querySelectorAll(sel)); }

  /** "contact.phoneDisplay" gibi noktalı yolu nesneden okur. */
  function al(nesne, yol) {
    return yol.split('.').reduce(function (o, k) {
      return (o && o[k] !== undefined && o[k] !== null) ? o[k] : null;
    }, nesne);
  }

  /** Küçük DOM üretici: el('span', {class: 'x'}, ['metin', düğüm]) */
  function el(etiket, ozellik, cocuklar) {
    var d = document.createElement(etiket);
    Object.keys(ozellik || {}).forEach(function (k) {
      var v = ozellik[k];
      if (v === false || v === null || v === undefined) return;
      if (k === 'text') d.textContent = v;
      else d.setAttribute(k, v === true ? '' : v);
    });
    (cocuklar || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      d.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return d;
  }

  /** {ilce} / {hizmet} yer tutucularını doldurup wa.me linki üretir. */
  function waLink(hizmet, ilce, hazirMesaj) {
    if (!cfg) return null;
    var mesaj = hazirMesaj;
    if (!mesaj) {
      var sablon = al(cfg, 'contact.whatsappMessage') || 'Merhaba, bilgi almak istiyorum.';
      mesaj = sablon
        .replace(/\{ilce\}/g, ilce || seciliIlce)
        .replace(/\{hizmet\}/g, hizmet || 'boya badana');
      // Reklamdan geldiyse mesaja ekle — hangi kanalın döndüğü konuşmada görünsün
      var q = new URLSearchParams(location.search);
      if (q.get('utm_source') || q.get('gclid')) mesaj += ' (Google)';
    }
    return 'https://wa.me/' + al(cfg, 'contact.whatsapp') + '?text=' + encodeURIComponent(mesaj);
  }

  /* ---------------------------------------------------------- saat / açık-kapalı */

  /** Eskişehir saatiyle {gun: 1-7 (Pzt-Paz), dakika, saatMetni "14:05", ay, gunNo} */
  function simdiIstanbul() {
    var f = new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric', hour12: false
    });
    var p = {};
    f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var gunler = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    var sa = parseInt(p.hour, 10) % 24;
    var dk = parseInt(p.minute, 10);
    return {
      gun: gunler[p.weekday] || 1,
      dakika: sa * 60 + dk,
      saatMetni: String(sa).padStart(2, '0') + ':' + String(dk).padStart(2, '0'),
      tarihMetni: p.day + '.' + p.month + '.' + p.year,
      ayGun: p.month + p.day
    };
  }

  function dakikayaCevir(hhmm) {
    var b = String(hhmm).split(':');
    return parseInt(b[0], 10) * 60 + parseInt(b[1] || '0', 10);
  }

  /** Çalışma saatlerine göre gerçekten açık mıyız? */
  function acikMi(now) {
    if (!cfg) return { acik: true, metin: 'Şu anda çevrimiçi' };
    if (al(cfg, 'calisma.surekliAcik')) {
      return { acik: true, metin: al(cfg, 'calisma.acikMetin') || 'Şu anda çevrimiçi' };
    }
    var slotlar = al(cfg, 'calisma.saatler') || [];
    for (var i = 0; i < slotlar.length; i++) {
      var s = slotlar[i];
      if (s.gunler.indexOf(now.gun) === -1) continue;
      if (now.dakika >= dakikayaCevir(s.acilis) && now.dakika < dakikayaCevir(s.kapanis)) {
        return { acik: true, metin: al(cfg, 'calisma.acikMetin') || 'Şu anda çevrimiçi' };
      }
    }
    return { acik: false, metin: al(cfg, 'calisma.kapaliMetin') || 'Şu anda kapalıyız' };
  }

  function chipleriGuncelle() {
    var now = simdiIstanbul();
    var durum = acikMi(now);
    $$('[data-online-chip]').forEach(function (chip) {
      chip.setAttribute('data-open', durum.acik ? 'true' : 'false');
      var etiket = $('[data-online-text]', chip);
      if (etiket) etiket.textContent = durum.metin;
      var saat = $('[data-clock]', chip);
      if (saat) saat.textContent = now.saatMetni;
      chip.setAttribute('title', 'Eskişehir saati ' + now.saatMetni);
    });
  }

  /* ---------------------------------------------------------- JSON uygulama */

  function icerigiUygula() {
    if (!cfg) return;

    // Metin alanları:  <span data-field="contact.phoneDisplay">
    $$('[data-field]').forEach(function (el) {
      var deger = al(cfg, el.getAttribute('data-field'));
      if (deger !== null && deger !== '') el.textContent = deger;
    });

    var tel = al(cfg, 'contact.phone');
    if (tel) $$('[data-tel]').forEach(function (el) { el.setAttribute('href', 'tel:' + tel); });

    $$('[data-wa]').forEach(function (el) {
      var link = waLink(el.getAttribute('data-wa-hizmet'), el.getAttribute('data-wa-ilce'));
      if (link) el.setAttribute('href', link);
    });

    var mail = al(cfg, 'contact.email');
    if (mail) $$('[data-mail]').forEach(function (el) { el.setAttribute('href', 'mailto:' + mail); });

    // Adres yalnızca db.json'da açıkça gösterilmek istenirse görünür
    var adresVar = al(cfg, 'address.goster') === true && !!al(cfg, 'address.streetAddress');
    $$('[data-adres-blok]').forEach(function (el) { el.hidden = !adresVar; });

    var maps = al(cfg, 'address.mapsUrl');
    $$('[data-maps]').forEach(function (el) {
      if (maps) { el.setAttribute('href', maps); el.hidden = false; }
      else el.hidden = true;
    });

    // Sosyal medya: boşsa liste öğesiyle birlikte gizle
    $$('[data-sosyal]').forEach(function (el) {
      var url = al(cfg, 'sosyal.' + el.getAttribute('data-sosyal'));
      var kap = el.closest('li') || el;
      if (url) { el.setAttribute('href', url); kap.hidden = false; }
      else kap.hidden = true;
    });

    // Garanti süresi tanımlı değilse garanti ifadeleri gösterilmez
    var garanti = al(cfg, 'bilgi.garantiAy');
    $$('[data-garanti]').forEach(function (el) { el.hidden = !garanti; });

    semaGuncelle();
  }

  /** Sayfadaki JSON-LD bloğunu db.json ile senkron tutar. */
  function semaGuncelle() {
    var script = $('#schema-org');
    if (!script || !cfg) return;
    try {
      var veri = JSON.parse(script.textContent);
      (veri['@graph'] || []).forEach(function (dugum) {
        if (dugum['@type'] !== 'HousePainter') return;
        dugum.name = al(cfg, 'brand.legalName') || dugum.name;
        dugum.telephone = al(cfg, 'contact.phone') || dugum.telephone;
        var mail = al(cfg, 'contact.email');
        if (mail && dugum.email) dugum.email = mail;
        if (dugum.address) {
          var sokak = al(cfg, 'address.goster') === true && al(cfg, 'address.streetAddress');
          if (sokak) dugum.address.streetAddress = sokak;
          else delete dugum.address.streetAddress;
          dugum.address.addressLocality = al(cfg, 'address.addressLocality') || dugum.address.addressLocality;
          dugum.address.addressRegion = al(cfg, 'address.addressRegion') || dugum.address.addressRegion;
          var pk = al(cfg, 'address.postalCode');
          if (pk) dugum.address.postalCode = pk; else delete dugum.address.postalCode;
        }
        var enlem = al(cfg, 'address.enlem'), boylam = al(cfg, 'address.boylam');
        if (dugum.geo && enlem && boylam) { dugum.geo.latitude = enlem; dugum.geo.longitude = boylam; }
        var sosyal = ['instagram', 'facebook', 'googleIsletme']
          .map(function (k) { return al(cfg, 'sosyal.' + k); })
          .filter(Boolean);
        if (sosyal.length) dugum.sameAs = sosyal;
      });
      script.textContent = JSON.stringify(veri);
    } catch (e) { /* şema bozulmasın diye sessiz geç */ }
  }

  /* ---------------------------------------------------------- dönüşüm takibi */

  /**
   * Google etiketleri db.json → takip alanlarından yüklenir. Alanlar boşken hiçbir
   * izleme kodu sayfaya eklenmez. Etiket HTML'e gömülürse (window.gtag varsa) bu
   * yükleyici hiçbir şey yapmaz; script iki kez yüklenmez.
   */
  function takibiBaslat() {
    if (typeof window.gtag === 'function') return;
    var adsId = al(cfg, 'takip.googleAdsId');
    var ga4 = al(cfg, 'takip.ga4Id');
    if (!adsId && !ga4) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    if (adsId) window.gtag('config', adsId);
    if (ga4) window.gtag('config', ga4);

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + (adsId || ga4);
    document.head.appendChild(s);
  }

  /** tur: 'arama' | 'whatsapp' | 'teklif' */
  function donusumGonder(tur, etiketBilgi) {
    if (typeof window.gtag !== 'function') return;
    var adsId = al(cfg, 'takip.googleAdsId');
    var etiketler = {
      arama: al(cfg, 'takip.aramaDonusumEtiketi'),
      whatsapp: al(cfg, 'takip.whatsappDonusumEtiketi'),
      teklif: al(cfg, 'takip.teklifDonusumEtiketi') || al(cfg, 'takip.whatsappDonusumEtiketi')
    };
    if (adsId && etiketler[tur]) {
      window.gtag('event', 'conversion', { send_to: adsId + '/' + etiketler[tur] });
    }
    var olay = { arama: 'telefon_tikla', whatsapp: 'whatsapp_tikla', teklif: 'teklif_gonder' }[tur];
    window.gtag('event', olay, {
      event_category: 'iletisim',
      event_label: etiketBilgi || seciliIlce
    });
  }

  /* ---------------------------------------------------------- etkileşimler */

  function mobilMenu() {
    var btn = $('.nav-toggle');
    var nav = $('#main-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var acik = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', acik ? 'false' : 'true');
      btn.setAttribute('aria-expanded', acik ? 'false' : 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.setAttribute('data-open', 'false');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function ilceSekmeleri() {
    var tablar = $$('.district-tab');
    if (!tablar.length) return;

    tablar.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var slug = tab.getAttribute('data-ilce');
        tablar.forEach(function (t) {
          t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        });
        $$('.district-panel').forEach(function (p) {
          p.hidden = p.getAttribute('data-ilce-panel') !== slug;
        });

        seciliIlce = tab.textContent.trim();

        // Hero'daki keşif chip'i seçilen ilçeye göre güncellensin
        var durum = tab.getAttribute('data-durum');
        var etaEl = $('[data-eta-text]');
        if (etaEl && durum) etaEl.textContent = seciliIlce + ': ' + durum;

        // WhatsApp mesajları seçilen ilçeyi taşısın
        $$('[data-wa]:not([data-wa-ilce])').forEach(function (el) {
          var link = waLink(el.getAttribute('data-wa-hizmet'), seciliIlce);
          if (link) el.setAttribute('href', link);
        });

        // Teklif formundaki ilçe, kullanıcı elle seçmediyse sekmeyi izlesin
        $$('[data-ilce-select]').forEach(function (s) {
          if (s.getAttribute('data-dokunuldu')) return;
          s.value = seciliIlce;
          s.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
    });
  }

  function tiklamaTakibi() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.indexOf('tel:') === 0) donusumGonder('arama');
      else if (href.indexOf('wa.me') > -1 && !a.hasAttribute('data-basari-wa')) donusumGonder('whatsapp');
    });
  }

  /* ==========================================================================
     HIZLI TEKLİF
     partials/teklif-formu.html htmx ile sayfaya gelir; seçenek grupları
     db.json → teklif bölümünden üretilir. Gönderilince fiyat gösterilmez,
     WhatsApp açılır ve indirimli fiyatın oradan iletileceği belirtilir.
     ========================================================================== */

  var teklifSayac = 0;

  function teklifNoUret() {
    var on = al(cfg, 'teklif.teklifNoOnEk') || 'TKL';
    var rasgele = String(Math.floor(1000 + Math.random() * 9000));
    return on + '-' + simdiIstanbul().ayGun + '-' + rasgele;
  }

  /** Türkiye numarasını 10 haneye indirger: 5321234567. Geçersizse null. */
  function telefonNormalize(ham) {
    var r = String(ham || '').replace(/\D/g, '');
    if (r.indexOf('90') === 0 && r.length === 12) r = r.slice(2);
    if (r.indexOf('0') === 0 && r.length === 11) r = r.slice(1);
    return /^[2-5]\d{9}$/.test(r) ? r : null;
  }
  function telefonBicimle(on) {
    return '0' + on.slice(0, 3) + ' ' + on.slice(3, 6) + ' ' + on.slice(6, 8) + ' ' + on.slice(8);
  }

  /** Emoji / madde işaretini atıp önizleme kartı etiketi üretir: "🏠 Konut" → "Konut" */
  function sadeEtiket(metin) {
    return String(metin || '').replace(/^[^A-Za-zÇĞİÖŞÜçğıöşü0-9]+/, '').trim();
  }

  function secenekleriAl(grup) {
    if (grup.kaynak === 'hizmetler') {
      return (al(cfg, 'hizmetler') || []).map(function (h) {
        return { id: h.slug, ad: h.ad, acil: h.slug === 'acil-boyaci' };
      });
    }
    return grup.secenekler || [];
  }

  function opsiyon(tip, ad, deger, metin, ekSinif, veri) {
    var input = el('input', { type: tip, name: ad, value: deger });
    Object.keys(veri || {}).forEach(function (k) { input.setAttribute('data-' + k, veri[k]); });
    return el('label', { class: 'opt' + (ekSinif ? ' ' + ekSinif : '') }, [input, el('span', { text: metin })]);
  }

  function grupOlustur(grup) {
    var tip = grup.tip === 'coklu' ? 'checkbox' : 'radio';
    var legend = el('legend', {}, [
      grup.etiket,
      grup.zorunlu ? el('span', { class: 'req', 'aria-hidden': 'true', text: '*' }) : null,
      grup.ipucu ? el('span', { class: 'hint', text: grup.ipucu }) : null
    ]);
    var opts = el('div', { class: 'opts' });
    var detaylar = [];
    secenekleriAl(grup).forEach(function (s) {
      opts.appendChild(opsiyon(tip, grup.id, s.id, s.ad, s.acil ? 'is-acil' : '', { ad: s.ad, acil: s.acil ? '1' : '' }));
      if (s.detay) {
        detaylar.push(el('input', {
          class: 'tf-input tf-detay', type: 'text', name: grup.id + '__' + s.id,
          placeholder: s.detay, 'aria-label': s.detay, 'data-detay-for': s.id, hidden: true, maxlength: '140'
        }));
      }
    });
    var fs = el('fieldset', {
      class: 'tf-group', 'data-grup': grup.id,
      'data-kosul': (grup.kosul || []).join(','),
      'aria-required': grup.zorunlu ? 'true' : null
    }, [legend, opts].concat(detaylar).concat([el('span', { class: 'tf-hata', 'data-hata': grup.id, role: 'alert' })]));
    return fs;
  }

  function ekAlanOlustur(alan) {
    var kap;
    if (alan.tip === 'secim') {
      var opts = el('div', { class: 'opts' });
      (alan.secenekler || []).forEach(function (s) {
        opts.appendChild(opsiyon('radio', 'ek_' + alan.id, s, s, '', { ad: s }));
      });
      kap = el('fieldset', { class: 'tf-group', 'data-ek-hizmet': alan.hizmet, 'data-ek-id': alan.id, 'data-ek-etiket': alan.etiket },
        [el('legend', { text: alan.etiket }), opts]);
    } else {
      var id = 'tf-ek-' + alan.id + '-' + teklifSayac;
      kap = el('div', { class: 'tf-field', 'data-ek-hizmet': alan.hizmet, 'data-ek-id': alan.id, 'data-ek-etiket': alan.etiket }, [
        el('label', { class: 'tf-label', for: id, text: alan.etiket }),
        el('input', {
          class: 'tf-input', id: id, name: 'ek_' + alan.id,
          type: alan.tip === 'sayi' ? 'number' : 'text',
          inputmode: alan.tip === 'sayi' ? 'numeric' : null,
          min: alan.tip === 'sayi' ? '1' : null, max: alan.tip === 'sayi' ? '999' : null,
          placeholder: alan.yer || '', maxlength: '160'
        })
      ]);
    }
    return kap;
  }

  /** Formun o anki durumunu düz bir nesneye çevirir. */
  function formuOku(app) {
    var form = $('[data-teklif-form]', app);
    var gruplar = al(cfg, 'teklif.gruplar') || [];
    var secHizmetler = $$('input[name="hizmet"]:checked', form).map(function (i) { return i.value; });

    var veri = { satirlar: [], hizmetler: secHizmetler, acil: false, eksik: {} };

    gruplar.forEach(function (g) {
      var fs = $('[data-grup="' + g.id + '"]', form);
      if (!fs || fs.hidden) return;
      var secili = $$('input[name="' + g.id + '"]:checked', fs);
      var degerler = secili.map(function (i) {
        if (i.getAttribute('data-acil')) veri.acil = true;
        var metin = i.getAttribute('data-ad');
        var detay = $('[data-detay-for="' + i.value + '"]', fs);
        if (detay && detay.value.trim()) metin += ': ' + detay.value.trim();
        return metin;
      });
      if (g.zorunlu && !degerler.length) veri.eksik[g.id] = true;
      veri.satirlar.push({ etiket: g.onizleme || g.etiket, deger: degerler.join(', '), grup: g.id });

      // Hizmete bağlı ek alanlar hizmet satırının hemen altına
      if (g.id === 'hizmet') {
        $$('[data-ek-hizmet]', form).forEach(function (k) {
          if (k.hidden) return;
          var deger = '';
          var r = $('input:checked', k);
          var t = $('input.tf-input', k);
          if (r) deger = r.value;
          else if (t && t.value.trim()) deger = t.value.trim() + (t.type === 'number' ? ' adet' : '');
          veri.satirlar.push({ etiket: '• ' + k.getAttribute('data-ek-etiket'), deger: deger, grup: 'ek' });
        });
      }
    });

    var ilce = $('[name="ilce"]', form).value;
    var mahalle = $('[name="mahalle"]', form).value.trim();
    veri.konum = [ilce, mahalle].filter(Boolean).join(' / ');
    veri.ad = $('[name="ad"]', form).value.trim();
    veri.telefonHam = $('[name="telefon"]', form).value.trim();
    var tel = telefonNormalize(veri.telefonHam);
    veri.telefon = tel ? telefonBicimle(tel) : '';
    veri.not = $('[name="not"]', form).value.trim();
    veri.no = app.getAttribute('data-teklif-no');
    return veri;
  }

  function mesajUret(v) {
    var t = al(cfg, 'teklif') || {};
    var satirlar = [t.mesajGiris || 'Merhaba, hızlı teklif almak istiyorum.'];
    if (v.acil) satirlar.push(t.mesajAcil || '🚨 ACİL TALEP');
    satirlar.push('');
    satirlar.push('🧾 Teklif No: ' + v.no);
    v.satirlar.forEach(function (s) { if (s.deger) satirlar.push(s.etiket + ': ' + s.deger); });
    if (v.konum) satirlar.push('📍 Konum: ' + v.konum);
    if (v.ad) satirlar.push('👤 Ad Soyad: ' + v.ad);
    satirlar.push('📞 Telefon: ' + (v.telefon || v.telefonHam || '—'));
    if (v.not) { satirlar.push(''); satirlar.push('📝 Not: ' + v.not); }
    satirlar.push('');
    satirlar.push(t.mesajKapanis || 'İndirimli fiyat teklifimi bekliyorum.');
    var q = new URLSearchParams(location.search);
    if (q.get('utm_source') || q.get('gclid')) satirlar.push('(Google)');
    return satirlar.join('\n');
  }

  function onizlemeGuncelle(app) {
    var v = formuOku(app);
    var dl = $('[data-satirlar]', app);
    dl.textContent = '';

    function satir(etiket, deger, bosMetin) {
      dl.appendChild(el('div', {}, [
        el('dt', { text: sadeEtiket(etiket) }),
        el('dd', { class: deger ? null : 'bos', text: deger || bosMetin || 'Seçilmedi' })
      ]));
    }

    v.satirlar.forEach(function (s) {
      if (s.grup === 'ek' && !s.deger) return;
      satir(s.etiket, s.deger);
    });
    satir('Konum', v.konum, 'Eskişehir');
    if (v.ad) satir('Müşteri', v.ad);
    satir('Telefon', v.telefon || v.telefonHam, 'Girilmedi');
    if (v.not) satir('Not', v.not);

    var bant = $('[data-acil-bant]', app);
    if (bant) bant.hidden = !v.acil;

    var balon = $('[data-wa-mesaj]', app);
    if (balon) balon.textContent = mesajUret(v);
    var zaman = $('[data-wa-zaman]', app);
    if (zaman) zaman.textContent = simdiIstanbul().saatMetni;
    return v;
  }

  /** Seçilen hizmetlere göre koşullu grupları ve ek alanları aç/kapa. */
  function kosullariUygula(app) {
    var form = $('[data-teklif-form]', app);
    var secili = $$('input[name="hizmet"]:checked', form).map(function (i) { return i.value; });

    $$('[data-grup]', form).forEach(function (fs) {
      var kosul = fs.getAttribute('data-kosul');
      if (kosul) {
        var liste = kosul.split(',');
        fs.hidden = !secili.some(function (s) { return liste.indexOf(s) > -1; });
      }
      // "Özel ölçü" gibi detay isteyen seçenekler
      $$('[data-detay-for]', fs).forEach(function (d) {
        var hedef = $('input[value="' + d.getAttribute('data-detay-for') + '"]', fs);
        d.hidden = !(hedef && hedef.checked);
      });
    });

    var gorunen = 0;
    $$('[data-ek-hizmet]', form).forEach(function (k) {
      var acik = secili.indexOf(k.getAttribute('data-ek-hizmet')) > -1;
      k.hidden = !acik;
      if (acik) gorunen++;
    });
    var ekKutu = $('[data-ek-kutu]', form);
    if (ekKutu) ekKutu.hidden = gorunen === 0;
  }

  function hataGoster(app, alan, mesaj) {
    var hedef = $('[data-hata="' + alan + '"]', app);
    if (hedef) hedef.textContent = mesaj || '';
    var fs = $('[data-grup="' + alan + '"]', app);
    if (fs) fs.classList.toggle('has-error', !!mesaj);
    if (alan === 'telefon') {
      var inp = $('[name="telefon"]', app);
      if (mesaj) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
    }
  }

  function dogrula(app, v) {
    var ilkHata = null;
    var gruplar = al(cfg, 'teklif.gruplar') || [];
    gruplar.forEach(function (g) {
      if (!g.zorunlu) return;
      var msj = v.eksik[g.id] ? (g.id === 'hizmet' ? 'En az bir hizmet seçin.' : 'Lütfen bir seçim yapın.') : '';
      hataGoster(app, g.id, msj);
      if (msj && !ilkHata) ilkHata = $('[data-grup="' + g.id + '"] input', app);
    });
    var telHata = '';
    if (!v.telefonHam) telHata = 'Size teklifi iletebilmemiz için telefon numaranız gerekli.';
    else if (!v.telefon) telHata = 'Numarayı 05XX XXX XX XX biçiminde yazın.';
    hataGoster(app, 'telefon', telHata);
    if (telHata && !ilkHata) ilkHata = $('[name="telefon"]', app);

    if (ilkHata) {
      ilkHata.focus({ preventScroll: true });
      ilkHata.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  function onSecimUygula(app) {
    var kap = app.closest('[data-teklif]');
    var liste = [];
    if (kap && kap.getAttribute('data-onsecim')) liste = kap.getAttribute('data-onsecim').split(',');
    var q = new URLSearchParams(location.search).get('hizmet');
    if (q) liste.push(q);
    liste.forEach(function (slug) {
      var i = $('input[name="hizmet"][value="' + slug.trim() + '"]', app);
      if (i) i.checked = true;
    });
    if (liste.indexOf('acil-boyaci') > -1) {
      var acil = $('input[name="zamanlama"][data-acil="1"]', app);
      if (acil) acil.checked = true;
    }
  }

  function teklifKur(app) {
    if (app.hasAttribute('data-hazir')) return;
    var gruplarKutu = $('[data-teklif-gruplar]', app);

    if (!cfg) {
      if (cfgHata) {
        $('[data-teklif-ekran]', app).hidden = true;
        $('[data-teklif-yedek]', app).hidden = false;
      }
      return; // cfg gelince yeniden denenecek
    }
    app.setAttribute('data-hazir', '');
    teklifSayac++;

    // Seçenek grupları + hizmete bağlı ek alanlar
    gruplarKutu.textContent = '';
    (al(cfg, 'teklif.gruplar') || []).forEach(function (g) {
      gruplarKutu.appendChild(grupOlustur(g));
      if (g.id === 'hizmet') {
        var ek = el('div', { class: 'tf-ek', 'data-ek-kutu': '', hidden: true }, [
          el('p', { class: 'tf-ek-baslik', text: 'Seçtiğiniz hizmete göre' })
        ]);
        (al(cfg, 'teklif.ekAlanlar') || []).forEach(function (a) { ek.appendChild(ekAlanOlustur(a)); });
        gruplarKutu.appendChild(ek);
      }
    });

    // İlçe listesi
    var ilceSec = $('[data-ilce-select]', app);
    if (ilceSec) {
      ilceSec.textContent = '';
      ilceSec.appendChild(el('option', { value: '', text: 'İlçe seçin' }));
      (al(cfg, 'ilceler') || []).forEach(function (i) { ilceSec.appendChild(el('option', { value: i, text: i })); });
      if (seciliIlce !== 'Eskişehir') ilceSec.value = seciliIlce;
      ilceSec.addEventListener('change', function (e) { if (e.isTrusted) ilceSec.setAttribute('data-dokunuldu', '1'); });
    }

    var form = $('[data-teklif-form]', app);
    app.setAttribute('data-teklif-no', teklifNoUret());
    var tarih = simdiIstanbul().tarihMetni;
    $$('[data-teklif-no-yaz]', app).forEach(function (n) { n.textContent = app.getAttribute('data-teklif-no'); });
    $$('[data-teklif-tarih]', app).forEach(function (n) { n.textContent = tarih; });

    onSecimUygula(app);
    kosullariUygula(app);
    onizlemeGuncelle(app);

    function degisti(e) {
      var t = e.target;
      // Acil boyacı seçilince zamanlama da "acil" olsun (henüz seçilmediyse)
      if (t.name === 'hizmet' && t.value === 'acil-boyaci' && t.checked) {
        var zaman = $('input[name="zamanlama"]:checked', form);
        var acil = $('input[name="zamanlama"][data-acil="1"]', form);
        if (!zaman && acil) acil.checked = true;
      }
      kosullariUygula(app);
      if (t.closest('[data-grup]')) hataGoster(app, t.closest('[data-grup]').getAttribute('data-grup'), '');
      if (t.name === 'telefon' && telefonNormalize(t.value)) hataGoster(app, 'telefon', '');
      onizlemeGuncelle(app);
    }
    form.addEventListener('input', degisti);
    form.addEventListener('change', degisti);

    var telInp = $('[name="telefon"]', form);
    telInp.addEventListener('blur', function () {
      var n = telefonNormalize(telInp.value);
      if (n) { telInp.value = telefonBicimle(n); onizlemeGuncelle(app); }
    });

    var onizleGit = $('[data-onizle-git]', app);
    if (onizleGit) {
      onizleGit.addEventListener('click', function () {
        $('[data-onizleme]', app).scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = onizlemeGuncelle(app);
      if (!dogrula(app, v)) return;

      var link = waLink(null, null, mesajUret(v));
      // Açılış tıklamanın içinde, senkron — açılır pencere engeline takılmasın
      var w = window.open(link, '_blank');
      if (w) { try { w.opener = null; } catch (err) { /* yok say */ } }

      var hizmetAdlari = v.satirlar.filter(function (s) { return s.grup === 'hizmet'; }).map(function (s) { return s.deger; }).join('');
      donusumGonder('teklif', hizmetAdlari);

      var basari = $('[data-teklif-basari]', app);
      $('[data-basari-baslik]', basari).textContent = al(cfg, 'teklif.basariBaslik') || 'Teklif talebiniz hazır!';
      $('[data-basari-metin]', basari).textContent =
        (al(cfg, 'teklif.basariMetin') || '').replace(/\{telefon\}/g, v.telefon);
      $('[data-basari-no]', basari).textContent = v.no;
      $('[data-basari-wa]', basari).setAttribute('href', link);
      $('[data-teklif-ekran]', app).hidden = true;
      basari.hidden = false;
      basari.focus({ preventScroll: true });
      basari.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    var yeni = $('[data-yeni-teklif]', app);
    if (yeni) {
      yeni.addEventListener('click', function () {
        form.reset();
        app.setAttribute('data-teklif-no', teklifNoUret());
        $$('[data-teklif-no-yaz]', app).forEach(function (n) { n.textContent = app.getAttribute('data-teklif-no'); });
        onSecimUygula(app);
        kosullariUygula(app);
        onizlemeGuncelle(app);
        $('[data-teklif-basari]', app).hidden = true;
        $('[data-teklif-ekran]', app).hidden = false;
        app.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  function teklifleriBaslat() {
    $$('[data-teklif-app]').forEach(teklifKur);
  }

  /* ---------------------------------------------------------- başlat */

  function baslat() {
    mobilMenu();
    ilceSekmeleri();
    tiklamaTakibi();
    chipleriGuncelle();
    setInterval(chipleriGuncelle, 30000);

    // Seçenekler henüz kurulmadan gönderilirse sayfa GET ile yenilenmesin
    document.addEventListener('submit', function (e) {
      if (e.target.matches('[data-teklif-form]') && !e.target.closest('[data-hazir]')) e.preventDefault();
    }, true);

    // htmx ile sonradan gelen teklif formu: JSON'daki bilgiler + seçenekler uygulanır
    document.body.addEventListener('htmx:load', function () {
      if (cfg) icerigiUygula();
      teklifleriBaslat();
    });

    // Yıl
    $$('[data-yil]').forEach(function (n) { n.textContent = new Date().getFullYear(); });

    fetch(DB_URL, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(r.status)); })
      .then(function (veri) {
        cfg = veri;
        icerigiUygula();
        chipleriGuncelle();
        takibiBaslat();
        teklifleriBaslat();
      })
      .catch(function () {
        cfgHata = true;
        teklifleriBaslat();
        console.warn('[Eskişehir Boya Badana] data/db.json okunamadı; HTML’deki varsayılan bilgiler kullanılıyor.');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
