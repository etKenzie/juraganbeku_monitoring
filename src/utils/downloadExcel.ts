import { getCookie } from "cookies-next";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const questions = [
  { id: "A1001", text: "Apakah rasa produk sesuai? (Kurang manis, Terlalu manis, atau Hambar)" },
  { id: "A1002", text: "Apakah tampilan / Warna produk sesuai?" },
  { id: "A1003", text: "Apakah tekstur sesuai dengan produk?" },
  { id: "A1004", text: "Apakah produk dilengkapi sedotan dan sesuai varian yang dipesan?" },
  { id: "A1005", text: "Apakah produk diseal dengan baik?" },
  { id: "A1006", text: "Apakah produk ditempel sticker varian produk?" },
  { id: "A1007", text: "Apakah produk bebas dari benda asing?" },
  { id: "A1008", text: "Apakah produk tidak terasa basi atau berbau?" },
  { id: "A1009", text: "Apakah cashier menyapa customer yang datang?" },
  { id: "A1010", text: "Apakah suara cashier terdengar dengan jelas?" },
  { id: "A1011", text: "Apakah Cashier melayani dengan senyum?" },
  { id: "A1012", text: "Apakah cashier menanyakan nama customer?" },
  { id: "A1013", text: "Apakah cashier menanyakan orderan customer?" },
  { id: "A1014", text: "Apakah cashier melakukan up selling dengan menawarkan promo yang berlangsung?" },
  { id: "A1015", text: "Apakah cashier menyebutkan ulang pesanan customer?" },
  { id: "A1016", text: "Apakah cashier menanyakan metode pembayaran?" },
  { id: "A1017", text: "Apakah cashier menggunakan Topi & Apron? (Hijab: Tanpa Topi) (Non Hijab: Dengan Topi)" },
  { id: "A1018", text: "Apakah cashier memberikan struk?" },
  { id: "A1019", text: "Apakah cashier menutup transaksi dengan meminta customer untuk menunggu dan mengucapkan terima kasih?" },
  { id: "A1020", text: "Apakah crew store memanggil nama customer dengan jelas? (bukan nomor struk)" },
  { id: "A1021", text: "Apakah crew store menyebutkan kembali orderan?" },
  { id: "A1022", text: "Apakah crew store menggunakan Topi & Apron? (Hijab: Tanpa Topi) (Non Hijab: Menggunakan Topi)" },
  { id: "A1023", text: "Apakah crew store mengucapkan terima kasih dan salam perpisahan (Hati-Hati di Jalan, Jika Haus Datang Kembali)?" },
  { id: "A1024", text: "Apakah area lantai teras bersih dari sampah?" },
  { id: "A1025", text: "Apakah area parkir terdapat tempat sampah?" },
  { id: "A1026", text: "Apakah sign haus dalam kondisi bersih?" },
  { id: "A1027", text: "Apakah lantai lobby bagian dalam store, dalam keadaan bersih?" },
  { id: "A1028", text: "Apakah kursi dan meja dalam kondisi bersih dari sisa makanan?" },
  { id: "A1029", text: "Apakah ruangan store bebas dari Bau atau Aroma tidak sedap?" },
  { id: "A1030", text: "Apakah Suhu ruangan sudah nyaman menurut anda?" },
  { id: "A1031", text: "Apakah musik sesuai dengan volume yang baik?" },
  { id: "A1032", text: "Apakah Display Menu dalam kondisi baik dan bersih?" },
  { id: "A1033", text: "Apakah Mural Dinding / Akrilik POP dalam kondisi baik dan bersih?" },
  { id: "A1034", text: "Apakah semua pencahayaan bersih, beroperasi dengan baik?" },
  { id: "A1035", text: "Apakah AC bersih dan beroperasi dengan baik?" },
  { id: "A1036", text: "Apakah crew tidak memakai aksesoris? (cincin/gelang)" },
  { id: "A1037", text: "Apakah Kerjasama antar team terlihat saat bekerja?" },
  { id: "A1038", text: "Apakah crew dengan sigap melayani customer?" },
  { id: "A1039", text: "Apakah karyawan berperilaku profesional, sopan dan santun?" },
  { id: "B1001", text: "Apakah rasa produk sesuai? (Kurang manis, Terlalu manis, atau Hambar)" },
  { id: "B1002", text: "Apakah Tampilan / Warna produk sesuai? (Terlalu Pekat, Terlalu Pucat)" },
  { id: "B1003", text: "Apakah diberi topping sesuai standar?" },
  { id: "B1004", text: "Apakah tekstur sesuai dengan standar? (Terlalu Keras, Terlalu Kenyal)" },
  { id: "B1005", text: "Apakah tekstur Kuah/saus sesuai dengan standar? (Terlalu Kental, Terlalu Cair)" },
  { id: "B1006", text: "Apakah lid penutup tertutup dengan rapat?" },
  { id: "B1007", text: "Apakah produk bebas dari benda asing?" },
  { id: "B1008", text: "Apakah produk tidak terasa basi atau berbau?" },
];

export const handleDownloadExcelHausGerai = async (startDate?: string, endDate?: string) => {
  let apiUrl = `${process.env.NEXT_PUBLIC_VISIT_URL}/mistery-shopper?all=true`;

  if (startDate || endDate) {
    apiUrl += `&startDate=${startDate || ""}&endDate=${endDate || ""}`;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${getCookie("token")}` },
    });
    const result = await response.json();

    if (!result || !result.data || result.data.length === 0) {
      console.log("No data available to download.");
      return;
    }

    const excelData: any[] = [];

    result.data.forEach(
      (item: { [x: string]: any; agent_name: any; age: any; store_code: any; store_name: any; store_type: any; menu: any; period: any; year: any; date: any; time: any }, index: number) => {
        questions.forEach((question) => {
          excelData.push({
            No: index + 1,
            "Nama Agent": item.nama_agent,
            Umur: item.umur,
            "Kode Gerai": item.kode_gerai,
            "Store Name": item.store_name || item.store,
            "Store Type": item.store_type,
            Menu: item.menu,
            Periode: item.period,
            Tanggal: format(new Date(item.createdAt), "dd-MM-yyyy"),
            Waktu: format(new Date(item.createdAt), "HH:mm:ss"),
            "ID Pertanyaan": question.id,
            "Teks Pertanyaan": question.text,
            Jawaban: item[question.id],
          });
        });
      }
    );

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 5 }, // No
      { wch: 20 }, // Nama Agent
      { wch: 10 }, // Umur
      { wch: 15 }, // Kode Gerai
      { wch: 25 }, // Store Name
      { wch: 15 }, // Store Type
      { wch: 60 }, // Menu
      { wch: 10 }, // Periode
      { wch: 20 }, // Tanggal
      { wch: 20 }, // Waktu
      { wch: 15 }, // ID Pertanyaan
      { wch: 80 }, // Teks Pertanyaan
      { wch: 10 }, // Jawaban
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Haus Gerai Data");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const excelFile = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(excelFile, "all_data_haus_gerai.xlsx");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const handleDownloadExcelJiwa = async (startDate?: string, endDate?: string) => {
  try {
    let apiUrl = `${process.env.NEXT_PUBLIC_VISIT_URL}/mistery-shopper?all=true`;

    if (startDate || endDate) {
      apiUrl += `&startDate=${startDate || ""}&endDate=${endDate || ""}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${getCookie("token")}`,
      },
    });
    const result = await response.json();

    if (!result || !result.data || result.data.length === 0) {
      console.log("No data available to download.");
      return;
    }

    const brandId = Number(getCookie("brand_id"));

    // Menyesuaikan header berdasarkan brandId
    const getHeaders = (brandId: number) => {
      switch (brandId) {
        case 2: // janji jiwa
          return [
            "No",
            "Kode Jilid",
            "Store",
            "Menu Makanan",
            "Menu Minuman",
            "Tanggal",
            "Apakah Signage dan Jilid toko menyala dan lengkap?",
            "Apakah semua TV menyala dan content sesuai standard?",
            "Nilai kebersihan toko saat Anda tiba",
            "Bagaimana Anda menilai kebersihan lantai?",
            "Bagaimana Anda menilai kebersihan meja kursi?",
            "Bagaimana Anda menilai kerapihan Marketing Props (Informasi Promo, NPL, Banner, dll.)?",
            "Apakah toilet dan tempat cuci tangan bersih?",
            "Apakah toilet dan tempat cuci tangan lengkap dengan perlengkapan?",
            "Bagaimana Anda menilai pencahayaan di toko?",
            "Bagaimana volume suara musik di toko?",
            "Seberapa nyaman suhu di toko?",
            "Berapa lama waktu yang diperlukan untuk Anda disalami saat memasuki toko?",
            "Bagaimana Anda menilai keramahan staf yang menyapa Anda?",
            "Bagaimana Anda menilai penampilan staf yang sedang bekerja?",
            "Bagaimana Anda menilai standard kerapihan seragam staf yang sedang bekerja?",
            "Apakah kasir mengulangi pesanan anda dengan lengkap dan akurat?",
            "Apakah kasir menawarkan aplikasi?",
            "Apakah kasir melakukan upselling: menawarkan promo/upsize/topping/dll ?",
            "Apakah kasir memberikan struk sesuai pesanan?",
            "Seberapa paham kasir tentang menu?",
            "Apakah kasir mengucapkan terima kasih setelah transaksi?",
            "Berapa lama waktu yang dibutuhkan untuk menyelesaikan pesanan Anda (1 minuman dan 1 makanan) setelah struk dikeluarkan?",
            "Seberapa akurat spesifikasi minuman Anda (kustomisasi minuman)?",
            "Seberapa akurat spesifikasi makanan Anda?",
            "Apakah staff memanggil nama Anda ketika memberikan pesanan?",
            "Bagaimana Anda menilai rasa kopi/minuman Anda?",
            "Apakah kopi disajikan pada suhu yang tepat sesuai pesanan? (Panas / Dingin)",
            "Apakah presentasi produk Minuman yang disajikan tidak berantakan?",
            "Apakah ada label order pada minuman yang disajikan?",
            "Bagaimana Anda menilai rasa makanan Anda?",
            "Apakah makanan disajikan pada suhu dan tekstur yang tepat?",
            "Apakah presentasi produk Makanan yang disajikan tidak berantakan?",
            "Apakah ada label order pada makanan yang disajikan?",
            "Apakah staff mengucapkan 'terima kasih janji datang kembali' ketika Anda meninggalkan toko?",
            "Seberapa puas Anda dengan pengalaman Anda secara keseluruhan di toko ini?",
            "Seberapa besar kemungkinan Anda untuk kembali ke toko ini?",
            "Seberapa besar kemungkinan Anda untuk merekomendasikan toko ini kepada orang lain?",
            "SCORE: Lingkungan Toko & Kebersihan",
            "SCORE: Pelayanan Pelanggan & Interaksi Staff",
            "SCORE: Kecepatan & Efisiensi",
            "SCORE: Kualitas Produk",
            "SCORE: Pengalaman Secara Keseluruhan",
            "TOTAL SCORE",
            "PERCENTAGE",
            "Antrian",
            "Total Crew",
            "Nama Staff",
            "Waktu masuk store sampai mendapatkan produk",
            "Service Time",
            "Nominal Struk",
            "Apa yang paling Anda sukai dari kunjungan Anda?",
            "Apa yang perlu diperbaiki?",
            "Ada komentar atau saran lainnya?",
            "Nama Agent",
          ];
        default:
          return ["No", "Nama Agent", "Kode Gerai", "Store", "Area", "Produk Yang Dipesan", "Nominal", "Tanggal Visit", "Jam Masuk Toko", "Jam Service Dimulai", "Nilai Kepuasan Pelanggan"];
      }
    };

    const calculatePoint = (value: string, weight: number) => {
      return value?.toLowerCase() === "yes" ? weight : 0;
    };

    // format time to get only hours and minutes
    const formatTime = (datetime: string) => {
      if (!datetime) return "";

      if (/^\d{2}:\d{2}$/.test(datetime)) {
        return datetime;
      }

      const time = new Date(datetime);
      const hours = time.getHours().toString().padStart(2, "0");
      const minutes = time.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`; // Format jam:menit
    };

    const getDataRows = (data: any[], brandId: number) => {
      return data.map((row: any, index: number) => {
        const product = row.product ? row.product.split(",").join(" | ") : ""; // Menambahkan pengecekan
        switch (brandId) {
          case 2:
            return [
              index + 1,
              row.kode_gerai || "Kode Jilid",
              row.store_name,
              row.menu_makanan,
              row.menu_minuman,
              row.createdAt ? format(new Date(row.createdAt), "dd MM yyyy") : "",
              row.lingkeb_1 || "",
              row.lingkeb_2 || "",
              row.lingkeb_3 || "",
              row.lingkeb_4 || "",
              row.lingkeb_5 || "",
              row.lingkeb_6 || "",
              row.lingkeb_7 || "",
              row.lingkeb_8 || "",
              row.lingkeb_9 || "",
              row.lingkeb_10 || "",
              row.lingkeb_11 || "",
              row.pel_1 || "",
              row.pel_2 || "",
              row.pel_3 || "",
              row.pel_4 || "",
              row.pel_5 || "",
              row.pel_6 || "",
              row.pel_7 || "",
              row.pel_8 || "",
              row.pel_9 || "",
              row.pel_10 || "",
              row.kec_1 || "",
              row.kec_2 || "",
              row.kec_3 || "",
              row.kec_4 || "",
              row.kual_1 || "",
              row.kual_2 || "",
              row.kual_3 || "",
              row.kual_4 || "",
              row.kual_5 || "",
              row.kual_6 || "",
              row.kual_7 || "",
              row.kual_8 || "",
              row.peng_1 || "",
              row.peng_2 || "",
              row.peng_3 || "",
              row.peng_4 || "",
              row.total_lingkeb || "",
              row.total_pel || "",
              row.total_kec || "",
              row.total_kual || "",
              row.total_peng || "",
              row.total_score || "",
              row.percentage ? `${Math.round(row.percentage)}%` : "",
              row.antrian || "",
              row.total_crew || "",
              row.nama_staff || "",
              row.time_1 || "",
              row.time_2 || "",
              row.nominal_struk || "",
              row.summary_1 || "",
              row.summary_2 || "",
              row.summary_3 || "",
              row.nama_agent || "",
            ];
          default:
            return [index + 3, row.nama_agent];
        }
      });
    };

    // Menentukan lebar kolom
    const getColumnWidths = (brandId: number) => {
      switch (brandId) {
        case 2:
          return [{ wpx: 30 }, { wpx: 120 }, { wpx: 100 }, { wpx: 120 }, { wpx: 80 }, { wpx: 180 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }, { wpx: 120 }, { wpx: 150 }];
        default:
          return [{ wpx: 30 }, { wpx: 120 }, { wpx: 100 }, { wpx: 120 }, { wpx: 80 }, { wpx: 180 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }];
      }
    };

    const headers = getHeaders(Number(brandId));
    const dataRows = getDataRows(result.data, brandId);
    const columnWidths = getColumnWidths(brandId);

    // Gabungkan headers dan data menjadi satu array
    const ws_data = [headers, ...dataRows];

    // Membuat worksheet dari data
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Menambahkan border pada semua sel
    const rangeRef = ws["!ref"];
    if (rangeRef) {
      const range = XLSX.utils.decode_range(rangeRef);
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cell_ref = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cell_ref]) ws[cell_ref] = {}; // Buat sel jika belum ada
          ws[cell_ref].s = {
            alignment: {
              vertical: "center", // Rata tengah secara vertikal
              horizontal: "center", // Rata tengah secara horizontal
              wrapText: true, // Membungkus teks jika terlalu panjang
            },
          };
        }
      }
    }

    ws["!cols"] = columnWidths;

    // Membuat workbook
    const wb = { Sheets: { Sheet1: ws }, SheetNames: ["Sheet1"] };

    // Mengubah workbook menjadi binary string dan membuat Blob
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

    const storedBrand = localStorage.getItem("brand_name");

    // Membuat Blob dan mengunduh file
    const blob = new Blob([s2ab(wbout)], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `all_data_janji_jiwa.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading all data:", error);
  }
};

export const handleDownloadExcelHangry = async (startDate?: string, endDate?: string) => {
  try {
    let apiUrl = `${process.env.NEXT_PUBLIC_VISIT_URL}/mistery-shopper?all=true`;

    if (startDate || endDate) {
      apiUrl += `&startDate=${startDate || ""}&endDate=${endDate || ""}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${getCookie("token")}`,
      },
    });
    const result = await response.json();

    if (!result || !result.data || result.data.length === 0) {
      console.log("No data available to download.");
      return;
    }

    const brandId = Number(getCookie("brand_id"));

    // Menyesuaikan header berdasarkan brandId
    const getHeaders = (brandId: number) => {
      switch (brandId) {
        case 3: // hangry
          return [
            "No",
            "Nama Agent",
            "Nama Gerai",
            "Area",
            "Kode Gerai",
            "Produk Yang Dipesan",
            "Nominal Struk",
            "Nominal Aplikasi",
            "Tanggal Visit",
            "Jam Masuk Toko",
            "Jam Service Dimulai",
            "Jam Pesanan Diterima",
            "Jam Pembelian",
            "Apakah produk diterima kurang dari 10 menit (terhitung dari jam pada bill hingga diterima?)",
            "Apakah Kasir menyapa costumer yang datang dengan ramah?",
            "Apakah tampilan seluruh crew rapih dan bersih?",
            "Apakah pengemasan produk sudah sesuai?",
            "Mohon jelaskan tentang masalah yang Anda alami (Kemasan)?",
            "Penjelasan Lainnya (Kemasan)",
            "Apakah porsi yang anda terima lengkap & sesuai?",
            "Mohon jelaskan tentang masalah yang Anda alami (Porsi)?",
            "Penjelasan Lainnya (Porsi)",
            "Apakah rasa dari produk sesuai?",
            "Mohon jelaskan tentang masalah yang Anda alami (Rasa Product)?",
            "Penjelasan Lainnya (Rasa Product)",
            "Apakah tekstur dari produk sesuai?",
            "Mohon jelaskan tentang masalah yang Anda alami (Tekstur)?",
            "Penjelasan Lainnya (Tekstur)",
            "Apakah semua produk yang diterima dalam keadaan fresh (segar)?",
            "Mohon jelaskan tentang masalah yang Anda alami (Kesegaran Makanan)?",
            "Penjelasan Lainnya (Kesegaran Makanan)",
            "Apakah semua produk yang diterima matang sempurna?",
            "Mohon jelaskan tentang masalah yang Anda alami (Kematangan Product)?",
            "Penjelasan Lainnya (Kematangan Product)",
            "Berapakah tingkat kepuasan anda terhadap produk ini?",
            "Percentage",
            "Bisakah Anda berbagi pengalaman Anda dengan produk kami?",
          ];
        default:
          return ["No", "Nama Agent", "Kode Gerai", "Store", "Area", "Produk Yang Dipesan", "Nominal", "Tanggal Visit", "Jam Masuk Toko", "Jam Service Dimulai", "Nilai Kepuasan Pelanggan"];
      }
    };

    const calculatePoint = (value: string, weight: number) => {
      return value?.toLowerCase() === "yes" ? weight : 0;
    };

    // format time to get only hours and minutes
    const formatTime = (datetime: string) => {
      if (!datetime) return "";

      if (/^\d{2}:\d{2}$/.test(datetime)) {
        return datetime;
      }

      const time = new Date(datetime);
      const hours = time.getHours().toString().padStart(2, "0");
      const minutes = time.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`; // Format jam:menit
    };

    const getDataRows = (data: any[], brandId: number) => {
      return data.map((row: any, index: number) => {
        const product = row.product ? row.product.split(",").join(" | ") : ""; // Menambahkan pengecekan
        const getShiftTime = (time: string | null) => {
          if (!time || typeof time !== "string") return "-";

          const [hour] = time.split(":").map(Number);
          if (isNaN(hour)) return "-"; // Handle jika parsing gagal

          if (hour >= 11 && hour < 14) return "11:00 - 14:00";
          if (hour >= 17 && hour < 21) return "17:00 - 21:00";

          return time; // Kembali ke nilai asli jika di luar shift
        };
        switch (brandId) {
          case 3:
            return [
              index + 1,
              row.nama_agent || "",
              row.store_name || "",
              row.area || "",
              row.kode_gerai || "",
              row.product ? row.product.split(",").join(" | ") : "",
              row.nominal || "",
              row.nominal_aplikasi || "",
              row.createdAt ? format(new Date(row.createdAt), "dd MM yyyy") : "",
              formatTime(row.jam_pemesanan) || "",
              formatTime(row.jam_pada_bill) || "",
              formatTime(row.jam_penerimaan_makanan ?? "") || "",
              getShiftTime(row.jam_pada_bill) || "",
              calculatePoint(row.kurang_dari_10menit, 5),
              calculatePoint(row.kasir_p1, 5),
              calculatePoint(row.crew_p1, 5),
              calculatePoint(row.kemas_p1, 5),
              row.kemas_p2 || "",
              row.kemas_comment || "",
              calculatePoint(row.porsi_p1, 16),
              row.porsi_p2 || "",
              row.porsi_comment || "",
              calculatePoint(row.rasa_product_p1, 16),
              row.rasa_product_p2 || "",
              row.rasa_product_comment || "",
              calculatePoint(row.tekstur_p1, 16),
              row.tekstur_p2 || "",
              row.tekstur_comment || "",
              calculatePoint(row.kesegaran_makanan_p1, 16),
              row.kesegaran_makanan_p2 || "",
              row.kesegaran_makanan_comment || "",
              calculatePoint(row.kematangan_product_p1, 16),
              row.kematangan_product_p2 || "",
              row.kematangan_product_comment || "",
              row.tingkat_kepuasan || "",
              row.percentage ? `${Math.round(row.percentage)}%` : "",
              row.comment || "",
            ];
          default:
            return [
              index + 3,
              row.nama_agent,
              row.kode_gerai,
              row.store_name,
              row.area,
              product,
              row.nominal,
              row.createdAt ? format(new Date(row.createdAt), "E, d MMM yyyy") : "",
              formatTime(row.jam_masuk_toko),
              formatTime(row.jam_service_dimulai),
              row.tingkat_kepuasan || "",
            ];
        }
      });
    };

    // Menentukan lebar kolom
    const getColumnWidths = (brandId: number) => {
      switch (brandId) {
        case 3:
          return [{ wpx: 30 }, { wpx: 120 }, { wpx: 100 }, { wpx: 120 }, { wpx: 80 }, { wpx: 180 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }];
        default:
          return [{ wpx: 30 }, { wpx: 120 }, { wpx: 100 }, { wpx: 120 }, { wpx: 80 }, { wpx: 180 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }];
      }
    };

    const headers = getHeaders(Number(brandId));
    const dataRows = getDataRows(result.data, brandId);
    const columnWidths = getColumnWidths(brandId);

    // Gabungkan headers dan data menjadi satu array
    const ws_data = [headers, ...dataRows];

    // Membuat worksheet dari data
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Menambahkan border pada semua sel
    const rangeRef = ws["!ref"];
    if (rangeRef) {
      const range = XLSX.utils.decode_range(rangeRef);
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cell_ref = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cell_ref]) ws[cell_ref] = {}; // Buat sel jika belum ada
          ws[cell_ref].s = {
            alignment: {
              vertical: "center", // Rata tengah secara vertikal
              horizontal: "center", // Rata tengah secara horizontal
              wrapText: true, // Membungkus teks jika terlalu panjang
            },
          };
        }
      }
    }

    ws["!cols"] = columnWidths;

    // Membuat workbook
    const wb = { Sheets: { Sheet1: ws }, SheetNames: ["Sheet1"] };

    // Mengubah workbook menjadi binary string dan membuat Blob
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

    const storedBrand = localStorage.getItem("brand_name");

    // Membuat Blob dan mengunduh file
    const blob = new Blob([s2ab(wbout)], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `all_data_hangry.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading all data:", error);
  }
};

export const handleDownloadExcelDarmi = async (startDate?: string, endDate?: string) => {
  try {
    let apiUrl = `${process.env.NEXT_PUBLIC_VISIT_URL}/mistery-shopper?all=true`;

    if (startDate || endDate) {
      apiUrl += `&startDate=${startDate || ""}&endDate=${endDate || ""}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${getCookie("token")}`,
      },
    });
    const result = await response.json();

    if (!result || !result.data || result.data.length === 0) {
      console.log("No data available to download.");
      return;
    }

    const brandId = Number(getCookie("brand_id"));

    // Menyesuaikan header berdasarkan brandId
    const getHeaders = (brandId: number) => {
      switch (brandId) {
        case 4: // darmi
          return [
            "No",
            "Kode Outlet",
            "Tanggal Visit",
            "Nama Outlet",
            "Area",
            "Area Manager",
            "Menu",
            "Produk",
            "% Produk",
            "Cashier",
            "% Cashier",
            "Process",
            "% Process",
            "Serving",
            "% Serving",
            "People",
            "% People",
            "Tampilan Outlet",
            "% Tampilan Outlet",
            "Cleaness",
            "% Cleaness",
            "Total Penilaian",
            "% Total Penilaian",
            "Nama Crew yang menjadi cashier",
            "Nama Crew yang meracik product",
            "Nama Crew yang menyerahkan product",
            "Ada berapa jumlah crew yang bertugas",
            "Apakah crew merespons komplain dengan baik?",
            "Total Experience Time ",
            "Service Time",
            "Queue",
            "Kepuasan",
            "Produk dilengkapi dengan sedotan yang sesuai dengan varian yang dipesan?",
            "Produk diseal dengan baik",
            "Produk bebas dari benda asing",
            "Produk tidak terasa basi atau berbau",
            "Apakah seluruh menu dalam daftar tersedia?",
            "Greetings awal",
            "Suara dairysta terdengar dengan jelas",
            "Dairysta senyum saat menyapa customer",
            "Penyebutan produk best seller/rekomendasi",
            "Penawaran promo yang sedang berlangsung",
            "Penawaran upsize cup",
            "Penawaran tambahan produk lainnya",
            "Penawaran topping",
            "Menanyakan gula dan es batu",
            "Penawaran tropicana slim",
            "Penawaran tas tenteng ",
            "Mengkonfirmasi pesanan customer ",
            "Penawaran membership",
            "Menerima pembayaran dengan pecahan 50.000/100.000",
            "Menggunakan money detector",
            "Struk diberikan ke customer",
            "Menginformasikan promo struk ",
            "Mengarahkan customer ke bagian pick up",
            "Menutup transaksi dengan mengucapkan 'terima kasih'",
            "Dairysta yag meracik menggunakan handglove",
            "Penulisan keterangan rasa dan lainnya di cup ",
            "Dairysta yang meracik merasakan susu di gelas sloki",
            "Urutan penyajian di dalam cup benar ",
            "Pengecekan cup (dibalikkan)",
            "Penyebutan nomor antrian",
            "Pengecekan kembali kesesuaian pesanan",
            "Dairysta senyum saat memberikan pesanan",
            "Greetings akhir",
            "Dairysta yang menyerahkan menggunakan handglove",
            "Rambut Rapi",
            "Memakai Sepatu",
            "Memakai Topi",
            "Memakai Celemek",
            "Memakai ikat pinggang ",
            "Memakai Pin Di Sebelah Kanan",
            "Memakai Id Card Di Sebelah Kiri",
            "Baju dimasukkan kecuali batik",
            "Display menu terpasang dengan baik",
            "Banner promo terpasang dengan baik",
            "Papan tanda terpasang jelas dan baik",
            "Informasi kebijakan halal terlihat dengan jelas",
            "Informasi 'Pembelian tanpa struk, Gratis' terlihat dengan jelas",
            "Informasi QR keluhan customer terlihat dengan jelas",
            "Informasi QR membership",
            "Media pada akrilik tidak kosong",
            "Semua pencahayaan beroperasi dengan baik",
            "Video pada TV berjalan ",
            "Display menu bersih",
            "Akrilik Bersih ",
            "Banner promo bersih",
            "Papan tanda bersih",
            "Lampu bersih",
            "Tampilan sisi luar outlet bersih (Fasad)",
            "Tempat sampah kecil bersih dan tidak bau",
            "Isi tempat sampah kecil",
            "Neon box bersih",
            "Signage bersih",
            "Lantai dalam outlet kering dan bersih",
            "Meja kerja bersih",
            "Meja kerja bebas dari perlengkapan pribadi ",
            "Isi tempat sampah dalam outlet",
            "Tempat sampah dalam outlet tertutup",
            "Sink bersih dan tidak berkerak ",
            "Outlet bebas dari bau tidak sedap",
            "Outlet bebas hama",
            "Alat kebersihan bersih dan tersimpan rapi ",
            "Kebersihan Lantai Tunggu (Sitting Area)",
            "nominal_struk",
            "Catatan / Temuan",
            "Penjelasan Complaint",
            "Rekomendasi",
            "Nama Agent",
          ];
        default:
          return ["No", "Nama Agent", "Kode Gerai", "Store", "Area", "Produk Yang Dipesan", "Nominal", "Tanggal Visit", "Jam Masuk Toko", "Jam Service Dimulai", "Nilai Kepuasan Pelanggan"];
      }
    };

    const calculatePoint = (value: string, weight: number) => {
      return value?.toLowerCase() === "yes" ? weight : 0;
    };

    // format time to get only hours and minutes
    const formatTime = (datetime: string) => {
      if (!datetime) return "";

      if (/^\d{2}:\d{2}$/.test(datetime)) {
        return datetime;
      }

      const time = new Date(datetime);
      const hours = time.getHours().toString().padStart(2, "0");
      const minutes = time.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`; // Format jam:menit
    };

    const getDataRows = (data: any[], brandId: number) => {
      return data.map((row: any, index: number) => {
        const product = row.product ? row.product.split(",").join(" | ") : ""; // Menambahkan pengecekan
        switch (brandId) {
          case 4:
            return [
              index + 1,
              row.kode_gerai || "",
              row.createdAt ? format(new Date(row.createdAt), "dd MM yyyy") : "",
              row.store_name || "",
              row.area || "",
              row.area_manager || "",
              row.menu || "",
              row.product_filled || "",
              row.product_percentage || "",
              row.cashier_filled || "",
              row.cashier_percentage || "",
              row.process_filled || "",
              row.process_percentage || "",
              row.serving_filled || "",
              row.serving_percentage || "",
              row.people_filled || "",
              row.people_percentage || "",
              row.outlet_filled || "",
              row.outlet_percentage || "",
              row.clean_filled || "",
              row.clean_percentage || "",
              row.total_score || "",
              row.total_percentage || "",
              row.crewc || "",
              row.crewp || "",
              row.crews || "",
              row.total_crew || "",
              row.hc || "",
              row.time_exp || "",
              row.time_ser || "",
              row.antrian || "",
              row.kepuasan || "",
              row.pkem1 || "",
              row.pkem2 || "",
              row.pfs1 || "",
              row.pfs2 || "",
              row.pkp1 || "",
              row.scas1 || "",
              row.scas2 || "",
              row.scas3 || "",
              row.scas4 || "",
              row.scas5 || "",
              row.scas6 || "",
              row.scas7 || "",
              row.scas8 || "",
              row.scas9 || "",
              row.scas10 || "",
              row.scas11 || "",
              row.scas12 || "",
              row.scas13 || "",
              row.scas14 || "",
              row.scas15 || "",
              row.scas16 || "",
              row.scas17 || "",
              row.scas18 || "",
              row.scas19 || "",
              row.spro1 || "",
              row.spro2 || "",
              row.spro3 || "",
              row.spro4 || "",
              row.sser1 || "",
              row.sser2 || "",
              row.sser3 || "",
              row.sser4 || "",
              row.sser5 || "",
              row.sser6 || "",
              row.speo1 || "",
              row.speo2 || "",
              row.speo3 || "",
              row.speo4 || "",
              row.speo5 || "",
              row.speo6 || "",
              row.speo7 || "",
              row.speo8 || "",
              row.tto1 || "",
              row.tto2 || "",
              row.tto3 || "",
              row.tto4 || "",
              row.tto5 || "",
              row.tto6 || "",
              row.tto7 || "",
              row.tto8 || "",
              row.tto9 || "",
              row.tto10 || "",
              row.clc1 || "",
              row.clc2 || "",
              row.clc3 || "",
              row.clc4 || "",
              row.clc5 || "",
              row.clc6 || "",
              row.clc7 || "",
              row.clc8 || "",
              row.clc9 || "",
              row.clc10 || "",
              row.clc11 || "",
              row.clc12 || "",
              row.clc13 || "",
              row.clc14 || "",
              row.clc15 || "",
              row.clc16 || "",
              row.clc17 || "",
              row.clc18 || "",
              row.clc19 || "",
              row.clc20 || "",
              row.nominal_struk || "",
              row.catatan || "",
              row.penjelasan_comp || "",
              row.rekomendasi || "",
              row.nama_agent || "",
            ];
          default:
            return [
              index + 3,
              row.nama_agent,
              row.kode_gerai,
              row.store_name,
              row.area,
              product,
              row.nominal,
              row.createdAt ? format(new Date(row.createdAt), "E, d MMM yyyy") : "",
              formatTime(row.jam_masuk_toko),
              formatTime(row.jam_service_dimulai),
              row.tingkat_kepuasan || "",
            ];
        }
      });
    };

    // Menentukan lebar kolom
    const getColumnWidths = (brandId: number) => {
      switch (brandId) {
        case 4:
          return [{ wpx: 30 }, { wpx: 120 }, { wpx: 100 }, { wpx: 120 }, { wpx: 80 }, { wpx: 180 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }];
        default:
          return [{ wpx: 30 }, { wpx: 120 }, { wpx: 100 }, { wpx: 120 }, { wpx: 80 }, { wpx: 180 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }, { wpx: 100 }];
      }
    };

    const headers = getHeaders(Number(brandId));
    const dataRows = getDataRows(result.data, brandId);
    const columnWidths = getColumnWidths(brandId);

    // Gabungkan headers dan data menjadi satu array
    const ws_data = [headers, ...dataRows];

    // Membuat worksheet dari data
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Menambahkan border pada semua sel
    const rangeRef = ws["!ref"];
    if (rangeRef) {
      const range = XLSX.utils.decode_range(rangeRef);
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cell_ref = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cell_ref]) ws[cell_ref] = {}; // Buat sel jika belum ada
          ws[cell_ref].s = {
            alignment: {
              vertical: "center", // Rata tengah secara vertikal
              horizontal: "center", // Rata tengah secara horizontal
              wrapText: true, // Membungkus teks jika terlalu panjang
            },
          };
        }
      }
    }

    ws["!cols"] = columnWidths;

    // Membuat workbook
    const wb = { Sheets: { Sheet1: ws }, SheetNames: ["Sheet1"] };

    // Mengubah workbook menjadi binary string dan membuat Blob
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });

    const storedBrand = localStorage.getItem("brand_name");

    // Membuat Blob dan mengunduh file
    const blob = new Blob([s2ab(wbout)], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `all_data_mbok_darmi.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading all data:", error);
  }
};

// Utility function to convert string to ArrayBuffer
function s2ab(s: string) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xff;
  }
  return buf;
}
