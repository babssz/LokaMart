"""Seed data contoh LokaMart: 13 penjual, 130 produk, 6 pembeli, dan pesanan contoh.

Cara pakai (dari folder backend, venv aktif, database sudah dimigrasi):

    python seed_demo.py              -> isi data saja
    python seed_demo.py --images     -> isi data + gambar placeholder (butuh: pip install pillow)

Aman dijalankan berulang kali: data yang sudah ada tidak dibuat dobel.
Semua akun contoh memakai password: password123 (HANYA untuk pengembangan lokal).
"""

import argparse
import random
import textwrap
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

from sqlalchemy import select

from database import SessionLocal
from models import Cart, Category, Order, OrderItem, Payment, Product, Store, User
from security import hash_password

DEMO_PASSWORD = "password123"
UPLOAD_DIR = Path(__file__).resolve().parent / "uploads" / "products"

CATEGORIES = [
    ("Batik & Tenun", "Kain batik tulis, batik cap, dan tenun khas Makassar"),
    ("Anyaman Kenjiran", "Kerajinan anyaman bambu, rotan, dan serat alami"),
    ("Kopi Sanggar", "Kopi lokal hasil sanggar dan petani setempat"),
    ("Kuliner Pusaka", "Makanan dan olahan khas dengan resep turun-temurun"),
    ("Keramik & Tanah Liat", "Kriya keramik dan terakota"),
]

# Tiap penjual: akun + toko + daftar produk (nama, harga, stok, deskripsi singkat)
SELLERS = [
    {
        "email": "sanggar.tamalate@lokamart.com",
        "owner": "Nurhayati",
        "phone": "081200000001",
        "store_name": "Sanggar Batik Tamalate",
        "store_desc": "Sanggar batik tulis dan cap bermotif aksara lontara dan perahu pinisi.",
        "address": "Jl. Dg. Tata, Tamalate, Makassar",
        "category": "Batik & Tenun",
        "products": [
            ("Kain Batik Tulis Motif Lontara 2 m", 485000, 15, "Batik tulis motif aksara lontara, katun primisima, pewarna alami."),
            ("Kain Batik Cap Motif Perahu Pinisi", 215000, 30, "Batik cap motif perahu pinisi, katun halus, ukuran 2 m."),
            ("Kemeja Batik Pria Motif Pinisi", 285000, 25, "Kemeja batik lengan panjang, bahan katun adem."),
            ("Blouse Batik Wanita Motif Kembang", 235000, 20, "Blouse batik dengan potongan longgar dan nyaman dipakai harian."),
            ("Dress Batik Tulis Motif Lontara", 520000, 10, "Dress batik tulis selutut, dilengkapi furing."),
            ("Scarf Batik Katun Persegi", 95000, 40, "Scarf batik katun ukuran 110 x 110 cm."),
            ("Sarung Batik Anak Motif Pinisi", 140000, 18, "Sarung batik anak ukuran 6 sampai 10 tahun."),
            ("Taplak Meja Batik Cap", 125000, 22, "Taplak meja batik cap ukuran 150 x 100 cm."),
            ("Dompet Batik Resleting", 65000, 35, "Dompet batik dengan resleting dan beberapa sekat kartu."),
            ("Tas Tote Batik Kanvas", 110000, 28, "Tas tote kanvas berpadu panel batik, muat laptop 14 inci."),
        ],
    },
    {
        "email": "sutra.daeng@lokamart.com",
        "owner": "Daeng Rahman",
        "phone": "081200000002",
        "store_name": "Rumah Sutra Daeng",
        "store_desc": "Sutra tenun khas Sengkang: sarung, selendang, dan busana.",
        "address": "Jl. Veteran Selatan, Mamajang, Makassar",
        "category": "Batik & Tenun",
        "products": [
            ("Sarung Sutra Sengkang Motif Kotak", 1250000, 6, "Sarung sutra tenun tangan motif kotak khas Bugis."),
            ("Sarung Sutra Sengkang Warna Maroon", 1450000, 5, "Sarung sutra tenun tangan warna maroon, benang halus."),
            ("Selendang Sutra Sengkang", 385000, 14, "Selendang sutra tenun ukuran 180 x 50 cm."),
            ("Kain Sutra Meteran 1 m", 275000, 20, "Kain sutra tenun per meter, cocok untuk kebaya dan kemeja."),
            ("Syal Sutra Polos", 195000, 25, "Syal sutra polos yang lembut dan ringan."),
            ("Dasi Sutra Motif Tenun", 125000, 22, "Dasi sutra tenun dengan motif geometris."),
            ("Kemeja Sutra Pria Lengan Panjang", 750000, 8, "Kemeja sutra tenun dengan potongan klasik."),
            ("Passapu Ikat Kepala Sutra", 165000, 16, "Ikat kepala passapu dari sutra, perlengkapan busana adat Bugis."),
            ("Dompet Sutra Mini", 85000, 30, "Dompet kecil berbahan sutra tenun, muat kartu dan uang."),
            ("Sarung Sutra Anak", 650000, 7, "Sarung sutra tenun ukuran anak, dikemas dalam kotak."),
        ],
    },
    {
        "email": "tenun.rappocini@lokamart.com",
        "owner": "Hasna",
        "phone": "081200000003",
        "store_name": "Tenun Nusantara Rappocini",
        "store_desc": "Tenun dan songket dari perajin Sulawesi Selatan.",
        "address": "Jl. Letjen Hertasning, Rappocini, Makassar",
        "category": "Batik & Tenun",
        "products": [
            ("Sarung Tenun Bugis Motif Kotak Besar", 175000, 30, "Sarung tenun Bugis katun, motif kotak besar."),
            ("Kain Songket Bugis Benang Emas", 950000, 6, "Songket Bugis dengan hiasan benang emas, dikerjakan manual."),
            ("Tenun Ikat Motif Geometris 2 m", 340000, 14, "Kain tenun ikat motif geometris, panjang 2 m."),
            ("Outer Tenun Wanita", 360000, 12, "Outer tenun dengan kancing kayu, ukuran all size."),
            ("Kemeja Tenun Pria", 295000, 18, "Kemeja tenun berbahan katun yang menyerap keringat."),
            ("Taplak Meja Tenun", 130000, 20, "Taplak meja tenun untuk meja makan 6 kursi."),
            ("Syal Tenun Katun", 85000, 35, "Syal tenun katun hangat dan lembut."),
            ("Tas Selempang Tenun", 155000, 24, "Tas selempang berbahan tenun dengan lapisan dalam kain."),
            ("Sandal Tenun Rumahan", 75000, 40, "Sandal rumah beralas empuk, bagian atas tenun."),
            ("Sarung Bantal Sofa Tenun", 90000, 26, "Sarung bantal sofa tenun ukuran 45 x 45 cm."),
        ],
    },
    {
        "email": "anyaman.panakkukang@lokamart.com",
        "owner": "Syamsul",
        "phone": "081200000004",
        "store_name": "Anyaman Bambu Panakkukang",
        "store_desc": "Kerajinan anyaman bambu untuk rumah tangga dan dekorasi.",
        "address": "Jl. Boulevard, Panakkukang, Makassar",
        "category": "Anyaman Kenjiran",
        "products": [
            ("Bakul Bambu Besar", 125000, 25, "Bakul bambu anyaman rapat, diameter 35 cm."),
            ("Tudung Saji Anyaman Bambu", 85000, 30, "Tudung saji bambu bermotif, diameter 50 cm."),
            ("Nampan Anyaman Bambu Bulat", 65000, 35, "Nampan bambu bulat untuk alas sajian."),
            ("Keranjang Pakaian Anyaman", 175000, 15, "Keranjang pakaian kotor anyaman bambu dengan tutup."),
            ("Kipas Anyaman Bambu", 25000, 80, "Kipas tangan bambu ringan dan kuat."),
            ("Tempat Tisu Anyaman", 45000, 40, "Tempat tisu persegi dari anyaman bambu halus."),
            ("Lampu Hias Anyaman Bambu", 135000, 18, "Kap lampu anyaman bambu untuk lampu gantung."),
            ("Tikar Anyaman Bambu 120 x 180 cm", 210000, 12, "Tikar bambu halus yang sejuk dipakai lesehan."),
            ("Hiasan Dinding Tampah Anyaman", 55000, 33, "Hiasan dinding berbentuk tampah mini."),
            ("Alas Piring Anyaman Bambu Set 6", 60000, 45, "Satu set 6 alas piring anyaman bambu."),
        ],
    },
    {
        "email": "pandan.mariso@lokamart.com",
        "owner": "Rosdiana",
        "phone": "081200000005",
        "store_name": "Kriya Pandan Mariso",
        "store_desc": "Kriya anyaman daun pandan: tikar, tas, dan aksesori.",
        "address": "Jl. Mochtar Lufti, Mariso, Makassar",
        "category": "Anyaman Kenjiran",
        "products": [
            ("Tikar Pandan Halus 160 x 200 cm", 185000, 14, "Tikar pandan anyaman halus, tidak mudah patah."),
            ("Tas Pandan Anyaman Belanja", 95000, 28, "Tas belanja pandan dengan tali kuat."),
            ("Dompet Pandan Anyaman", 45000, 50, "Dompet kecil anyaman pandan dengan resleting."),
            ("Topi Pandan Anyaman", 55000, 38, "Topi pandan lebar pelindung matahari."),
            ("Keranjang Pandan Serbaguna", 80000, 26, "Keranjang pandan untuk menyimpan aneka barang."),
            ("Alas Duduk Pandan Bulat", 60000, 30, "Alas duduk bulat dari anyaman pandan."),
            ("Tempat Pensil Pandan", 35000, 44, "Tempat pensil silinder anyaman pandan."),
            ("Sandal Anyaman Pandan Rumah", 70000, 32, "Sandal rumah anyaman pandan, ringan."),
            ("Clutch Pandan Pesta", 85000, 20, "Clutch anyaman pandan untuk acara santai."),
            ("Kotak Perhiasan Pandan", 65000, 25, "Kotak perhiasan anyaman pandan dengan tutup."),
        ],
    },
    {
        "email": "rotan.biringkanaya@lokamart.com",
        "owner": "Burhanuddin",
        "phone": "081200000006",
        "store_name": "Rotan & Lontar Biringkanaya",
        "store_desc": "Perabot dan aksesori dari rotan dan daun lontar.",
        "address": "Jl. Perintis Kemerdekaan, Biringkanaya, Makassar",
        "category": "Anyaman Kenjiran",
        "products": [
            ("Tas Rotan Bulat", 230000, 12, "Tas rotan bulat dengan tali kulit sintetis."),
            ("Keranjang Rotan Piknik", 195000, 15, "Keranjang piknik rotan dengan tutup dan pegangan."),
            ("Kursi Anak Rotan", 450000, 6, "Kursi rotan mungil untuk anak, kokoh dan ringan."),
            ("Lampu Gantung Rotan", 275000, 10, "Lampu gantung rotan diameter 45 cm, fitting E27."),
            ("Tempat Sampah Rotan", 120000, 18, "Tempat sampah rotan dengan lapisan plastik dalam."),
            ("Topi Anyaman Lontar", 60000, 36, "Topi anyaman daun lontar, ringan dan sejuk."),
            ("Tas Lontar Motif Etnik", 140000, 20, "Tas lontar dengan motif anyaman etnik."),
            ("Kotak Tisu Lontar", 50000, 42, "Kotak tisu anyaman lontar berbentuk persegi."),
            ("Tempat Payung Rotan", 165000, 11, "Tempat payung rotan tinggi 60 cm."),
            ("Nampan Lontar Bulat", 70000, 28, "Nampan anyaman lontar untuk sajian dan dekorasi."),
        ],
    },
    {
        "email": "kopi.mamajang@lokamart.com",
        "owner": "Andi Irfan",
        "phone": "081200000007",
        "store_name": "Kopi Sanggar Mamajang",
        "store_desc": "Kopi arabika dan robusta Sulawesi dari kebun mitra petani.",
        "address": "Jl. Gunung Lompobattang, Mamajang, Makassar",
        "category": "Kopi Sanggar",
        "products": [
            ("Kopi Arabika Toraja Biji Sangrai 250 g", 85000, 40, "Biji kopi arabika Toraja sangrai medium, aroma kuat."),
            ("Kopi Arabika Toraja Bubuk 250 g", 85000, 35, "Kopi arabika Toraja bubuk halus untuk seduh manual."),
            ("Kopi Arabika Kalosi Enrekang 250 g", 80000, 38, "Arabika Kalosi dengan rasa buah dan cokelat."),
            ("Kopi Arabika Sinjai 250 g", 78000, 30, "Arabika Sinjai berkarakter asam lembut dan manis."),
            ("Kopi Robusta Sulawesi 250 g", 55000, 45, "Robusta Sulawesi sangrai medium-dark, body tebal."),
            ("Kopi Toraja Drip Bag Isi 10", 65000, 50, "Kopi drip bag praktis, cukup seduh dengan air panas."),
            ("Kopi Gula Aren Sachet Isi 10", 45000, 60, "Kopi instan dengan gula aren, siap seduh."),
            ("Kopi Tubruk Sachet Isi 20", 40000, 70, "Kopi tubruk bubuk dalam sachet isi 20."),
            ("Kopi Arabika Toraja 1 kg", 310000, 14, "Kopi arabika Toraja kemasan hemat 1 kg."),
            ("Green Bean Arabika Toraja 1 kg", 220000, 12, "Biji hijau arabika Toraja untuk disangrai sendiri."),
        ],
    },
    {
        "email": "roastery.losari@lokamart.com",
        "owner": "Dewi Lestari",
        "phone": "081200000008",
        "store_name": "Roastery Losari",
        "store_desc": "Roastery kecil dengan racikan kopi dan minuman kopi botolan.",
        "address": "Jl. Penghibur, Ujung Pandang, Makassar",
        "category": "Kopi Sanggar",
        "products": [
            ("Kopi Arabika Bantaeng 200 g", 82000, 24, "Arabika Bantaeng sangrai medium, karakter floral."),
            ("Kopi Espresso Blend Medium Roast 250 g", 72000, 33, "Racikan espresso seimbang untuk mesin maupun moka pot."),
            ("Kopi House Blend Dark Roast 250 g", 68000, 40, "House blend dark roast, cocok untuk kopi susu."),
            ("Kopi Filter Light Roast 200 g", 90000, 20, "Light roast untuk seduhan V60 dan pour over."),
            ("Cold Brew Botol 250 ml", 28000, 50, "Cold brew siap minum, diseduh dingin 16 jam."),
            ("Cold Brew Botol 1 Liter", 85000, 20, "Cold brew kemasan keluarga 1 liter."),
            ("Kopi Cascara Tea 100 g", 55000, 25, "Teh kulit kopi (cascara) beraroma buah kering."),
            ("Paket Kopi Oleh-oleh Makassar 3 Varian", 195000, 15, "Tiga varian kopi 100 g dalam kotak hadiah."),
            ("Kopi Susu Gula Aren Botol 250 ml", 30000, 45, "Kopi susu gula aren siap minum."),
            ("Kopi Jahe Merah Sachet Isi 10", 38000, 55, "Kopi berpadu jahe merah, hangat di badan."),
        ],
    },
    {
        "email": "dapur.daeng@lokamart.com",
        "owner": "Daeng Baso",
        "phone": "081200000009",
        "store_name": "Dapur Daeng Ujung Pandang",
        "store_desc": "Bumbu, sambal, sirup, dan oleh-oleh khas Makassar.",
        "address": "Jl. Somba Opu, Ujung Pandang, Makassar",
        "category": "Kuliner Pusaka",
        "products": [
            ("Bumbu Coto Makassar Instan 100 g", 28000, 60, "Bumbu coto Makassar siap pakai untuk 6 porsi."),
            ("Bumbu Sop Konro 100 g", 30000, 55, "Bumbu sop konro dengan rempah lengkap."),
            ("Bumbu Pallubasa Instan 100 g", 28000, 50, "Bumbu pallubasa siap masak."),
            ("Sambal Roa Botol 200 g", 45000, 40, "Sambal ikan roa pedas gurih dalam botol kaca."),
            ("Sambal Mangga Muda Botol 200 g", 38000, 35, "Sambal mangga muda segar pedas asam."),
            ("Sirup Markisa Makassar 600 ml", 42000, 45, "Sirup markisa asli dengan rasa asam manis segar."),
            ("Sirup Jeruk Nipis 600 ml", 36000, 38, "Sirup jeruk nipis cocok untuk es dan minuman segar."),
            ("Pisang Ijo Instan Siap Seduh", 32000, 40, "Bubuk pisang ijo instan, tinggal diseduh dan disajikan."),
            ("Bolu Peca Khas Makassar", 55000, 30, "Kue bolu peca lembut berbahan telur dan gula pilihan."),
            ("Kacang Sangrai Bawang 250 g", 25000, 70, "Kacang tanah sangrai gurih berbumbu bawang."),
        ],
    },
    {
        "email": "pesisir.tallo@lokamart.com",
        "owner": "Hj. Marwah",
        "phone": "081200000010",
        "store_name": "Oleh-oleh Pesisir Tallo",
        "store_desc": "Olahan hasil laut: bandeng, abon ikan, dan rumput laut.",
        "address": "Jl. Tallo Lama, Tallo, Makassar",
        "category": "Kuliner Pusaka",
        "products": [
            ("Bandeng Presto Duri Lunak 500 g", 75000, 28, "Bandeng presto berduri lunak, siap digoreng."),
            ("Abon Ikan Cakalang 150 g", 58000, 36, "Abon ikan cakalang gurih dan tahan lama."),
            ("Abon Ikan Tuna 150 g", 62000, 32, "Abon ikan tuna bertekstur halus."),
            ("Kerupuk Ikan Tenggiri 250 g", 40000, 50, "Kerupuk ikan tenggiri renyah, belum digoreng."),
            ("Kerupuk Udang 250 g", 42000, 45, "Kerupuk udang berwarna alami dengan rasa gurih."),
            ("Ikan Teri Crispy Pedas 150 g", 38000, 48, "Teri crispy berbumbu pedas manis."),
            ("Rumput Laut Kering 250 g", 35000, 40, "Rumput laut kering untuk sayur dan agar-agar."),
            ("Keripik Rumput Laut 100 g", 28000, 55, "Keripik rumput laut renyah rasa original."),
            ("Stik Rumput Laut Original 100 g", 26000, 52, "Stik rumput laut gurih, camilan sehat."),
            ("Paket Oleh-oleh Pesisir 4 Item", 165000, 15, "Paket berisi bandeng presto, abon, kerupuk, dan keripik."),
        ],
    },
    {
        "email": "kue.bontoala@lokamart.com",
        "owner": "Ayu Lestari",
        "phone": "081200000011",
        "store_name": "Rumah Kue Tradisional Bontoala",
        "store_desc": "Kue kering dan kue tradisional buatan rumahan.",
        "address": "Jl. Bontoala, Bontoala, Makassar",
        "category": "Kuliner Pusaka",
        "products": [
            ("Bolu Cukke Kotak Isi 12", 48000, 30, "Bolu cukke lembut manis isi 12 potong."),
            ("Kue Sagu Keju 250 g", 45000, 35, "Kue sagu keju lumer di mulut."),
            ("Kue Kacang Tradisional 250 g", 38000, 40, "Kue kacang renyah berbahan kacang tanah pilihan."),
            ("Kue Bangkit Kelapa 250 g", 42000, 28, "Kue bangkit kelapa tipis dan wangi."),
            ("Kue Semprit Mentega 250 g", 46000, 30, "Kue semprit mentega berbentuk bunga."),
            ("Dodol Susu Kemasan 250 g", 40000, 33, "Dodol susu kenyal dan legit."),
            ("Kue Lidah Kucing 200 g", 44000, 25, "Kue lidah kucing renyah beraroma vanila."),
            ("Kue Pia Kacang Hijau Isi 10", 35000, 38, "Pia isi kacang hijau isi 10 buah."),
            ("Paket Kue Kering 3 Toples", 175000, 12, "Tiga toples kue kering pilihan, cocok untuk hantaran."),
            ("Kue Kelapa Pandan 250 g", 41000, 29, "Kue kelapa pandan renyah beraroma harum."),
        ],
    },
    {
        "email": "gerabah.manggala@lokamart.com",
        "owner": "Amiruddin",
        "phone": "081200000012",
        "store_name": "Sanggar Gerabah Manggala",
        "store_desc": "Gerabah tradisional untuk dapur dan dekorasi rumah.",
        "address": "Jl. Antang Raya, Manggala, Makassar",
        "category": "Keramik & Tanah Liat",
        "products": [
            ("Pot Tanah Liat Diameter 20 cm", 35000, 60, "Pot tanah liat polos untuk tanaman hias."),
            ("Pot Gantung Terakota", 48000, 40, "Pot gantung terakota dengan tali jute."),
            ("Cobek Tanah Liat 25 cm", 55000, 45, "Cobek tanah liat tebal dengan ulekan kayu."),
            ("Kendi Tanah Liat 1 Liter", 65000, 30, "Kendi tradisional pendingin air alami."),
            ("Set Teko Terakota Alami 1 Teko 4 Cangkir", 210000, 12, "Set teko terakota dengan 4 cangkir mungil."),
            ("Mangkuk Sup Gerabah", 40000, 50, "Mangkuk gerabah tahan panas untuk sup."),
            ("Piring Gerabah Makan Set 4", 120000, 22, "Satu set 4 piring gerabah berglasir alami."),
            ("Celengan Tanah Liat Ayam", 30000, 55, "Celengan tanah liat berbentuk ayam."),
            ("Wadah Bumbu Tanah Liat Tutup", 58000, 36, "Wadah bumbu tanah liat dengan tutup rapat."),
            ("Tungku Tanah Liat Mini", 90000, 18, "Tungku tanah liat mini untuk arang."),
        ],
    },
    {
        "email": "terakota.tamalanrea@lokamart.com",
        "owner": "Sri Wahyuni",
        "phone": "081200000013",
        "store_name": "Terakota Tamalanrea",
        "store_desc": "Keramik dan terakota dekoratif buatan tangan.",
        "address": "Jl. Perintis Kemerdekaan Km 10, Tamalanrea, Makassar",
        "category": "Keramik & Tanah Liat",
        "products": [
            ("Vas Terakota Tinggi 40 cm", 135000, 16, "Vas terakota tinggi bertekstur alami."),
            ("Vas Bunga Keramik Glasir Hijau", 95000, 24, "Vas keramik glasir hijau mengilap."),
            ("Gelas Keramik Glasir Set 2", 85000, 30, "Dua gelas keramik berglasir aman untuk minuman panas."),
            ("Mug Keramik Handmade", 55000, 42, "Mug keramik buatan tangan dengan pegangan nyaman."),
            ("Tempat Sabun Keramik", 35000, 38, "Tempat sabun keramik dengan lubang resapan."),
            ("Lampu Meja Terakota", 175000, 11, "Lampu meja terakota dengan kap kain."),
            ("Pot Kaktus Mini Keramik Set 3", 60000, 45, "Tiga pot mini keramik untuk kaktus dan sukulen."),
            ("Mangkuk Keramik Motif Etnik", 70000, 34, "Mangkuk keramik dengan motif etnik khas Sulawesi."),
            ("Hiasan Dinding Terakota", 90000, 20, "Hiasan dinding terakota berukir motif tradisional."),
            ("Teko Keramik Glasir Cokelat", 150000, 14, "Teko keramik glasir cokelat kapasitas 800 ml."),
        ],
    },
]

BUYERS = [
    ("andi.pratama@lokamart.com", "Andi Pratama", "081300000001", "Jl. Pettarani, Makassar"),
    ("siti.aminah@lokamart.com", "Siti Aminah", "081300000002", "Jl. Alauddin, Makassar"),
    ("rudi.hartono@lokamart.com", "Rudi Hartono", "081300000003", "Jl. Urip Sumoharjo, Makassar"),
    ("nur.fadilah@lokamart.com", "Nur Fadilah", "081300000004", "Jl. AP Pettarani, Makassar"),
    ("fajar.ramadhan@lokamart.com", "Fajar Ramadhan", "081300000005", "Jl. Sultan Alauddin, Makassar"),
    ("indah.permata@lokamart.com", "Indah Permata", "081300000006", "Jl. Racing Centre, Makassar"),
]

ORDER_STATUSES = ["selesai", "dikirim", "diproses", "dibayar", "dibatalkan"]
ORDER_WEIGHTS = [50, 15, 15, 10, 10]
PAYMENT_METHODS = ["transfer_bank", "e_wallet"]
NUM_ORDERS = 45

CATEGORY_COLORS = {
    "Batik & Tenun": (122, 18, 18),
    "Anyaman Kenjiran": (150, 110, 55),
    "Kopi Sanggar": (92, 64, 51),
    "Kuliner Pusaka": (176, 100, 38),
    "Keramik & Tanah Liat": (145, 72, 48),
}


# ---------------------------------------------------------------- helpers
def get_or_create_user(db, email, name, role, phone, address, password_hash):
    user = db.scalar(select(User).where(User.email == email))
    if user:
        return user, False
    user = User(
        name=name,
        email=email,
        password=password_hash,
        role=role,
        phone=phone,
        address=address,
        is_active=True,
    )
    db.add(user)
    db.flush()
    return user, True


def _load_font(size):
    from PIL import ImageFont

    for candidate in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size)
    except TypeError:
        return ImageFont.load_default()


def make_placeholder_image(product_name, store_name, category_name) -> str:
    """Bikin gambar placeholder JPEG sederhana, balikin jalur untuk kolom image."""
    from PIL import Image, ImageDraw

    width, height = 800, 800
    base = CATEGORY_COLORS.get(category_name, (90, 90, 90))
    img = Image.new("RGB", (width, height), base)
    draw = ImageDraw.Draw(img)

    # panel terang di bagian bawah supaya tampilan tidak datar
    lighter = tuple(min(255, c + 45) for c in base)
    draw.rectangle([0, int(height * 0.72), width, height], fill=lighter)

    title = "\n".join(textwrap.wrap(product_name, width=18))
    draw.multiline_text(
        (width / 2, height * 0.40),
        title,
        font=_load_font(58),
        fill="white",
        anchor="mm",
        align="center",
        spacing=12,
    )
    draw.text(
        (width / 2, height * 0.86),
        store_name,
        font=_load_font(34),
        fill="white",
        anchor="mm",
    )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.jpg"
    img.save(UPLOAD_DIR / filename, "JPEG", quality=85)
    return f"/uploads/products/{filename}"


# ---------------------------------------------------------------- seed steps
def seed_categories(db):
    result = {}
    for name, description in CATEGORIES:
        category = db.scalar(select(Category).where(Category.category_name == name))
        if category is None:
            category = Category(category_name=name, description=description)
            db.add(category)
            db.flush()
        result[name] = category
    return result


def seed_sellers_and_products(db, categories, password_hash, with_images):
    new_users = new_products = new_images = 0
    products_by_store = {}

    for seller in SELLERS:
        user, created = get_or_create_user(
            db,
            seller["email"],
            seller["owner"],
            "penjual",
            seller["phone"],
            seller["address"],
            password_hash,
        )
        new_users += created

        store = db.scalar(select(Store).where(Store.user_id == user.user_id))
        if store is None:
            store = Store(
                user_id=user.user_id,
                store_name=seller["store_name"],
                description=seller["store_desc"],
                address=seller["address"],
            )
            db.add(store)
            db.flush()

        category = categories[seller["category"]]
        store_products = []
        for name, price, stock, description in seller["products"]:
            product = db.scalar(
                select(Product).where(
                    Product.store_id == store.store_id, Product.product_name == name
                )
            )
            if product is None:
                product = Product(
                    store_id=store.store_id,
                    category_id=category.category_id,
                    product_name=name,
                    description=description,
                    price=Decimal(price),
                    stock=stock,
                    status="aktif",
                )
                db.add(product)
                db.flush()
                new_products += 1

            if with_images and not product.image:
                product.image = make_placeholder_image(
                    name, store.store_name, seller["category"]
                )
                new_images += 1
            store_products.append(product)

        products_by_store[store.store_id] = store_products

    return new_users, new_products, new_images, products_by_store


def seed_buyers(db, password_hash):
    buyers, created_count = [], 0
    for email, name, phone, address in BUYERS:
        user, created = get_or_create_user(
            db, email, name, "pembeli", phone, address, password_hash
        )
        if created:
            created_count += 1
            db.add(Cart(user_id=user.user_id))
        elif db.scalar(select(Cart).where(Cart.user_id == user.user_id)) is None:
            db.add(Cart(user_id=user.user_id))
        buyers.append(user)
    db.flush()
    return buyers, created_count


def seed_orders(db, buyers, products_by_store):
    buyer_ids = [b.user_id for b in buyers]
    if db.scalar(select(Order.order_id).where(Order.user_id.in_(buyer_ids)).limit(1)):
        return 0  # pesanan contoh sudah pernah dibuat

    rng = random.Random(42)
    store_ids = list(products_by_store)
    now = datetime.now()
    created = 0

    for _ in range(NUM_ORDERS):
        buyer = rng.choice(buyers)
        store_id = rng.choice(store_ids)
        candidates = [p for p in products_by_store[store_id] if p.stock >= 3]
        if not candidates:
            continue

        chosen = rng.sample(candidates, k=min(len(candidates), rng.randint(1, 3)))
        status = rng.choices(ORDER_STATUSES, weights=ORDER_WEIGHTS, k=1)[0]
        order_date = now - timedelta(
            days=rng.randint(0, 29), hours=rng.randint(0, 23), minutes=rng.randint(0, 59)
        )

        lines = [(p, rng.randint(1, 3)) for p in chosen]
        total = sum((p.price * qty for p, qty in lines), Decimal("0"))

        order = Order(
            user_id=buyer.user_id,
            store_id=store_id,
            order_date=order_date,
            total_amount=total,
            status=status,
        )
        db.add(order)
        db.flush()

        for product, qty in lines:
            db.add(
                OrderItem(
                    order_id=order.order_id,
                    product_id=product.product_id,
                    quantity=qty,
                    price=product.price,
                    subtotal=product.price * qty,
                )
            )
            if status != "dibatalkan":
                product.stock -= qty

        db.add(
            Payment(
                order_id=order.order_id,
                payment_method=rng.choice(PAYMENT_METHODS),
                payment_status="dikembalikan" if status == "dibatalkan" else "berhasil",
                payment_date=order_date,
            )
        )
        created += 1

    return created


def main():
    parser = argparse.ArgumentParser(description="Seed data contoh LokaMart")
    parser.add_argument(
        "--images",
        action="store_true",
        help="buat juga gambar placeholder untuk tiap produk (butuh Pillow)",
    )
    args = parser.parse_args()

    if args.images:
        try:
            import PIL  # noqa: F401
        except ImportError:
            raise SystemExit("Pillow belum terpasang. Jalankan: pip install pillow")

    password_hash = hash_password(DEMO_PASSWORD)
    db = SessionLocal()
    try:
        categories = seed_categories(db)
        new_sellers, new_products, new_images, products_by_store = (
            seed_sellers_and_products(db, categories, password_hash, args.images)
        )
        buyers, new_buyers = seed_buyers(db, password_hash)
        new_orders = seed_orders(db, buyers, products_by_store)
        db.commit()

        total_products = db.query(Product).count()
        print("Seed selesai")
        print(f"  Penjual baru : {new_sellers}")
        print(f"  Pembeli baru : {new_buyers}")
        print(f"  Produk baru  : {new_products}  (total produk di database: {total_products})")
        print(f"  Gambar baru  : {new_images}")
        print(f"  Pesanan baru : {new_orders}")
        print(f"  Password semua akun contoh: {DEMO_PASSWORD}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()