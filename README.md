# Truncgil MyCity WebGL

İzometrik 3D şehir yapma simülasyonu oyunu. Next.js, Three.js ve WebGL teknolojileri kullanılarak geliştirilmiştir.

![MyCity WebGL](https://kenney.nl/media/pages/assets/city-builder-kit/1926025821-1672734626/sample-2.png)

## 🎮 Özellikler

- **İzometrik 3D Görünüm**: Three.js ile gerçek zamanlı 3D rendering
- **Modüler Bina Sistemi**: Konut, ticari, sanayi ve hizmet binaları
- **RCI Zonlama**: Residential (Konut), Commercial (Ticari), Industrial (Sanayi) bölgeleri
- **Ekonomi Simülasyonu**: Bütçe yönetimi, vergi oranları, gelir/gider takibi
- **Trafik Sistemi**: Araçların yollarda hareketi ve A* pathfinding
- **Gece/Gündüz Döngüsü**: WebGL shaderları ile dinamik aydınlatma
- **Kaydetme/Yükleme**: localStorage ile otomatik kayıt
- **Çoklu Dil**: Türkçe ve İngilizce dil desteği
- **Responsive UI**: Tailwind CSS ile modern arayüz

## 🛠️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14 (App Router) |
| UI | React 18 + Tailwind CSS |
| 3D Rendering | Three.js + React Three Fiber |
| Post-Processing | Custom WebGL Shaders |
| State Management | Zustand |
| 3D Models | Kenney City Builder Kit (CC0) |
| i18n | next-intl |

## 🚀 Kurulum

1. **Repoyu klonlayın:**
```bash
git clone https://github.com/truncgil/mycity-webgl.git
cd mycity-webgl
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
# veya
yarn install
# veya
pnpm install
```

3. **Geliştirme sunucusunu başlatın:**
```bash
npm run dev
```

4. **Tarayıcıda açın:**
```
http://localhost:3000
```

## 🎯 Kontroller

| Tuş | Aksiyon |
|-----|---------|
| WASD / Ok tuşları | Kamera hareketi |
| Fare tekerleği | Yakınlaştır/Uzaklaştır |
| Sol tık | Bina/yol yerleştir |
| Sağ tık (basılı) | Kamera döndür |
| R | Binayı döndür |
| Delete | Yık |
| Space / P | Duraklat |
| 1 / 2 / 3 | Oyun hızı |
| F1 | Kaydet |
| F2 | Yükle |
| G | Izgara aç/kapat |

## 📁 Proje Yapısı

```
mycity_webgl/
├── public/
│   └── models/           # 3D modeller (GLTF)
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/
│   │   ├── game/         # Oyun bileşenleri
│   │   └── ui/           # UI bileşenleri
│   ├── game/
│   │   ├── core/         # GameEngine, EventBus
│   │   ├── simulation/   # Simülasyon sistemleri
│   │   ├── rendering/    # WebGL shaderları
│   │   └── entities/     # Bina, yol, araç
│   ├── stores/           # Zustand state
│   ├── types/            # TypeScript tipleri
│   ├── hooks/            # React hooks
│   └── i18n/             # Çeviri dosyaları
└── package.json
```

## 🎮 Oyun Sistemleri

### Ekonomi Sistemi
- Vergi gelirleri (konut, ticari, sanayi)
- Bakım giderleri
- Hizmet maliyetleri
- Gerçek zamanlı bütçe takibi

### Nüfus Sistemi
- Nüfus artışı ve göç
- İstihdam oranı
- Mutluluk hesaplama
- Demografik veriler

### Zonlama Sistemi
- RCI talep hesaplama
- Otomatik bina gelişimi
- Zone kapasitesi takibi

### Trafik Sistemi
- A* pathfinding algoritması
- Araç spawn ve hareket
- Trafik yoğunluğu hesaplama

## 🎨 3D Modeller

Oyunda [Kenney'nin City Builder Kit](https://kenney.nl/assets/city-builder-kit)'i kullanılmaktadır. Bu modeller CC0 (Public Domain) lisanslıdır ve ticari projelerde bile özgürce kullanılabilir.

## 🌍 Lokalizasyon

Oyun Türkçe ve İngilizce dillerini desteklemektedir. Yeni dil eklemek için:

1. `src/i18n/` altına yeni JSON dosyası ekleyin (örn: `de.json`)
2. `tr.json` yapısını takip edin
3. Uygulamayı yeniden başlatın

## 📝 Lisans

Bu proje MIT lisansı altında yayınlanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

3D modeller Kenney tarafından CC0 lisansı ile sağlanmıştır.

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit'leyin (`git commit -m 'Add amazing feature'`)
4. Push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📞 İletişim

- **Geliştirici**: Truncgil
- **Web**: [truncgil.com](https://truncgil.com)
- **GitHub**: [@truncgil](https://github.com/truncgil)

---

**Truncgil MyCity WebGL** - İzometrik şehir yapma simülasyonu 🏙️
