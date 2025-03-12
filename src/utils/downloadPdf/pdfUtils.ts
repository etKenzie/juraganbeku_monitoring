import { Product } from "@/app/(DashboardLayout)/types/apps/visit";
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import { formatRupiah } from "../currencyFormatter";
import { ProductHangry } from "@/app/(DashboardLayout)/dashboards/hangry/types";
import { ProductDarmi } from "@/app/(DashboardLayout)/dashboards/darmi/types";

export const handleSingleDownloadHangry = async (row: ProductHangry, setLoading: React.Dispatch<React.SetStateAction<boolean>>) => {
  setLoading(true);
  console.log(row);
  const doc = new jsPDF();
  // URL untuk logo
  const logo1Url = "/images/logos/topan.png"; // left icon
  const logo2Url = "/images/logos/hangry.png"; // right icon

  // Fungsi untuk memuat gambar (PNG atau SVG)
  const loadImageToBase64 = async (url: string | URL | Request) => {
    const response = await fetch(url);
    const blob = await response.blob();

    if (blob.type === "image/svg+xml") {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } else {
      // Untuk PNG/JPEG, cukup gunakan base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
  };

  try {
    const logo1Base64: string = (await loadImageToBase64(logo1Url)) as string;
    const logo2Base64: string = (await loadImageToBase64(logo2Url)) as string;

    // left icon
    doc.addImage(logo1Base64, "PNG", 10, 5, 40, 10);

    // right icon
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoWidth = 30;
    doc.addImage(logo2Base64, "PNG", pageWidth - logoWidth - 10, 5, logoWidth, 15);
  } catch (error) {
    console.error("Gagal memuat logo:", error);
  }

  // Judul
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CHECKLIST MYSTERY SHOPPER", 105, 30, { align: "center" });

  const jamPembelian = (() => {
    const jamTerima = row.jam_pada_bill;
    if (!jamTerima) return "-";

    const [hour] = typeof jamTerima === "string" ? jamTerima.split(":").map(Number) : [0, 0];
    if (hour >= 11 && hour < 14) return "11:00 - 14:00";
    if (hour >= 17 && hour < 21) return "17:00 - 21:00";
    return jamTerima; // Kembali ke nilai asli jika di luar shift
  })();

  // Detail Header
  const detailData = [
    {
      label: "Hari/Tanggal",
      value: new Date(row.createdAt).toLocaleDateString(),
    },
    { label: "Jam Masuk Toko", value: row.jam_pemesanan || "-" },
    { label: "Jam Service Dimulai", value: row.jam_pada_bill || "-" },
    { label: "Jam Product Diterima", value: row.jam_penerimaan_makanan || "-" },
    { label: "Store", value: row.store_name },
    { label: "Menu", value: row.product },
    { label: "Area", value: row.area },
    { label: "Jam Pembelian", value: jamPembelian },
  ];

  let yPosition = 40;
  detailData.forEach((item) => {
    doc.setFontSize(12);
    const wrappedText = doc.splitTextToSize(`${String(item.value) || "-"}`, 120); // Sesuaikan 120 dengan max width

    doc.text(`${item.label}`, 15, yPosition);
    doc.text(`:`, 65, yPosition);
    doc.text(wrappedText, 70, yPosition, { align: "left" });
    yPosition += wrappedText.length * 6;
  });

  // Tabel
  const questions = [
    { question: "Produk apa yang sedang kamu nilai", column: "product" },
    { question: "Foto Produk", column: "foto_product", isImage: true },
    { question: "Foto Bill", column: "foto_bill", isImage: true },
    { title: "KASIR & CREW" },
    {
      question: "Apakah Kasir menyapa costumer yang datang dengan ramah?",
      column: "kasir_p1",
      point: 5,
    },
    {
      question: "Apakah crew menggunakan seragam sesuai dengan SOP (pakaian & hairnet)?",
      column: "crew_p1",
      point: 5,
    },
    {
      question: "Apakah produk diterima kurang dari 10 menit (terhitung dari jam pada bill hingga diterima?)",
      column: "pelayanan_kurang_10_menit",
      point: 5,
    },
    { title: "KEMASAN" },
    {
      question: "Apakah pengemasan produk sudah sesuai?",
      column: "kemas_p1",
      point: 5,
    },
    ...(row.kemas_p1 === "No"
      ? [
          {
            question: "Mohon jelaskan masalah yang Anda alami",
            column: "kemas_p2",
          },
          { question: "Penjelasan Lain", column: "kemas_comment" },
          {
            question: "Gambar Kemasan",
            column: "kemas_image",
            isImage: true,
          },
        ]
      : []),
    { title: "PORSI" },
    {
      question: "Apakah porsi yang anda terima lengkap & sesuai?",
      column: "porsi_p1",
      point: 16,
    },
    {
      question: "Mohon jelaskan masalah yang Anda alami",
      column: "porsi_p2",
    },
    { question: "Penjelasan Lain", column: "porsi_comment" },
    { title: "RASA PRODUCT" },
    {
      question: "Apakah rasa dari product sudah sesuai?",
      column: "rasa_product_p1",
      point: 16,
    },
    {
      question: "Mohon jelaskan masalah yang Anda alami",
      column: "rasa_product_p2",
    },
    { question: "Penjelasan Lain", column: "rasa_product_comment" },
    { title: "TEKSTUR" },
    {
      question: "Apakah tekstur dari produk sesuai?",
      column: "tekstur_p1",
      point: 16,
    },
    {
      question: "Mohon jelaskan masalah yang Anda alami",
      column: "tekstur_p2",
    },
    { question: "Penjelasan Lain", column: "tekstur_comment" },
    { title: "KESEGARAN PRODUCT" },
    {
      question: "Apakah semua produk yang diterima dalam keadaan fresh (segar)?",
      column: "kesegaran_makanan_p1",
      point: 16,
    },
    {
      question: "Mohon jelaskan masalah yang Anda alami",
      column: "kesegaran_makanan_p2",
    },
    { question: "Penjelasan Lain", column: "kesegaran_makanan_comment" },
    { title: "KEMATANGAN PRODUCT" },
    {
      question: "Apakah semua produk yang diterima matang sempurna?",
      column: "kematangan_product_p1",
      point: 16,
    },
    {
      question: "Mohon jelaskan masalah yang Anda alami",
      column: "kematangan_product_p2",
    },
    { question: "Penjelasan Lain", column: "kematangan_comment" },
    { title: "OTHERS" },
    {
      question: "Berapakah tingkat kepuasan anda terhadap produk ini?",
      column: "tingkat_kepuasan",
    },
    { question: "Nominal Pembelian", column: "nominal" },
    { question: "Nominal Aplikasi", column: "nominal_aplikasi" },
    { question: "Feedback/masukan terkait produk", column: "comment" },
    { question: "Percentage", column: "", point: "percentage" },
  ];

  // Format data untuk tabel
  const tableData: any[][] = [];
  const imagesToDisplay = [];
  let questionNumber = 1;

  for (const item of questions) {
    if (item.title) {
      // Tambahkan row title dengan styling dan tanpa nomor
      tableData.push([
        {
          content: item.title,
          colSpan: 4,
          styles: {
            halign: "center",
            fillColor: [200, 200, 200],
            fontStyle: "bold",
          },
        },
      ]);
    } else if (item.isImage) {
      const imageUrl = row[item.column];
      if (imageUrl) {
        const imageBase64 = await loadImageToBase64(imageUrl);
        if (imageBase64) {
          const imageHeight = 100; // Ganti sesuai kebutuhan

          // Tambahkan baris khusus untuk gambar dengan tinggi cell lebih besar
          tableData.push([
            questionNumber++, // No
            item.question, // Question
            {
              content: "",
              imageBase64,
              imageHeight, // Tentukan tinggi gambar
              styles: { minCellHeight: 80 }, // Menetapkan min height untuk gambar
            },
            "", // Point
          ]);
        } else {
          tableData.push([
            questionNumber++, // No
            item.question, // Question
            "Gambar tidak tersedia", // Answer
            "", // Point
          ]);
        }
      }
    } else {
      const answer = item.column ? (row[item.column] !== undefined ? row[item.column] : "-") : "-";

      const point =
        item.point === "percentage" && row.percentage !== undefined // Cek jika point adalah "percentage"
          ? `${Math.round(Number(row.percentage))}%` // Format sebagai persentase tanpa desimal
          : item.point && row[item.point] !== undefined // Jika point adalah key di backend
          ? row[item.point] // Ambil nilai dari backend
          : item.column && typeof row[item.column] === "string" && row[item.column].toLowerCase() === "yes"
          ? (item.point ?? "").toString() // Jika value adalah "yes", gunakan nilai point
          : item.point !== undefined
          ? "0" // Jika point didefinisikan tetapi tidak memenuhi kondisi lainnya
          : ""; // Kosongkan jika point tidak didefinisikan

      tableData.push([questionNumber++, item.question, answer, point]);
    }
  }

  autoTable(doc, {
    head: [["No", "Question", "Answer", "Point"]],
    body: tableData,
    startY: yPosition + 10,
    pageBreak: "auto",
    styles: {
      halign: "left",
      valign: "middle",
      fontSize: 10,
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" }, // Kolom "No" dengan lebar lebih kecil
      1: { cellWidth: 80 }, // Kolom "Question" dengan lebar lebih besar
      2: { cellWidth: 70 }, // Kolom "Answer"
      3: { cellWidth: 15, halign: "center" }, // Kolom "Point"
    },
    didDrawCell: (data) => {
      const columnIndex = data.column.index;
      const rowIndex = data.row.index;

      if (rowIndex !== undefined && columnIndex === 2 && tableData[rowIndex]?.[columnIndex]?.imageBase64) {
        const cell = data.cell;
        const cellData = tableData[rowIndex][columnIndex];

        // Ukuran maksimal gambar sesuai cell
        const maxCellWidth = cell.width - 2; // Kurangi padding horizontal
        const maxCellHeight = cell.height - 2; // Kurangi padding vertikal
        const aspectRatio = 1; // Rasio aspek gambar persegi

        // Hitung ukuran gambar sesuai rasio aspek
        let finalWidth = maxCellWidth;
        let finalHeight = maxCellWidth / aspectRatio;

        if (finalHeight > maxCellHeight) {
          finalHeight = maxCellHeight;
          finalWidth = maxCellHeight * aspectRatio;
        }

        // Pusatkan gambar di dalam cell
        const x = cell.x + 2; // Pusatkan secara horizontal
        const y = cell.y + (cell.height - finalHeight) / 2; // Pusatkan secara vertikal

        // Tambahkan gambar ke dalam cell
        doc.addImage(cellData.imageBase64, "JPEG", x, y, finalWidth, finalHeight);
      }
    },
  });

  // Unduh PDF
  try {
    doc.save(
      `${row.kode_gerai}_${new Date(row.createdAt)
        .toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "numeric",
          year: "numeric",
        })
        .replace(/\//g, "-")}_${row.store_name}_${row.area}.pdf`
    );
  } catch (error) {
    console.error("Error saat membuat PDF:", error);
  } finally {
    setLoading(false); // Set loading ke false setelah selesai
  }
};

export const handleSingleDownloadJiwa = async (row: Product, setLoading: React.Dispatch<React.SetStateAction<boolean>>) => {
  setLoading(true);
  console.log(row);
  const doc = new jsPDF();

  const logo1Url = "/images/logos/topan.png";
  const logo2Url = "/images/logos/jiwa-logo.png";

  const loadImageToBase64 = async (url: string | URL | Request) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  try {
    const logo1Base64: string = (await loadImageToBase64(logo1Url)) as string;
    const logo2Base64: string = (await loadImageToBase64(logo2Url)) as string;
    doc.addImage(logo1Base64, "PNG", 10, 5, 40, 10);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(logo2Base64, "PNG", pageWidth - 40, 5, 30, 15);
  } catch (error) {
    console.error("Gagal memuat logo:", error);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CHECKLIST MYSTERY SHOPPER JIWA", 105, 30, { align: "center" });

  const detailData = [
    { label: "Nama Staff", value: row.nama_staff },
    {
      label: "Hari/Tanggal",
      value: new Date(row.createdAt)
        .toLocaleDateString("id-ID", {
          //     weekday: "long", // Nama hari dalam format panjang (misal: Senin, Selasa)
          day: "2-digit", // Menampilkan hari dengan 2 digit
          month: "long", // Menampilkan bulan dalam format panjang (misal: Januari, Februari)
          year: "numeric", // Menampilkan tahun
        })
        .replace(/, /g, " / "),
    },
    { label: "Jilid", value: row.store_name },
    { label: "Area", value: row.area },
    { label: "Menu Minuman", value: row.menu_minuman },
    { label: "Menu Makanan", value: row.menu_makanan },
  ];

  let yPosition = 40;

  detailData.forEach((item) => {
    doc.setFontSize(12);
    const wrappedText = doc.splitTextToSize(`${String(item.value) || "-"}`, 120); // Sesuaikan 120 dengan max width

    doc.text(`${item.label}`, 15, yPosition);
    doc.text(`:`, 65, yPosition);
    doc.text(wrappedText, 70, yPosition, { align: "left" });
    yPosition += wrappedText.length * 6;
  });

  const questions = [
    {
      category: "Lingkungan Kebersihan",
      bobot: "10%", // Tambahkan bobot per kategori
      fields: [
        {
          key: "lingkeb_1",
          question: "Apakah Signage dan Jilid toko menyala dan lengkap?",
          keterangan: "Kebersihan dan Kerapihan Toko",
        },
        {
          key: "lingkeb_2",
          question: "Apakah semua TV menyala dan content sesuai standard",
          keterangan: "Kebersihan dan Kerapihan Toko",
        },
        {
          key: "lingkeb_3",
          question: "Nilai kebersihan toko saat Anda tiba",
          keterangan: "Kebersihan dan Kerapihan Toko",
        },
        {
          key: "lingkeb_4",
          question: "Bagaimana Anda menilai kebersihan lantai?",
          keterangan: "Kebersihan dan Kerapihan Toko",
        },
        {
          key: "lingkeb_5",
          question: "Bagaimana Anda menilai kerapihan meja kursi?",
          keterangan: "Kebersihan dan Kerapihan Toko",
        },
        {
          key: "lingkeb_6",
          question: "Bagaimana Anda menilai kerapihan Marketing Props (Informasi Promo, NPL, Banner, dll.)?",
          keterangan: "Kebersihan dan Kerapihan Toko",
        },
        {
          key: "lingkeb_7",
          question: "Apakah toilet dan tempat cuci tangan bersih",
          keterangan: "Kebersihan Toilet (Jika Berlaku)",
        },
        {
          key: "lingkeb_8",
          question: "Apakah toilet dilengkapi dengan perlengkapan yang diperlukan?",
          keterangan: "Kebersihan Toilet (Jika Berlaku)",
        },
        {
          key: "lingkeb_9",
          question: "Bagaimana Anda menilai pencahayaan di toko",
          keterangan: "Suasana Toko",
        },
        {
          key: "lingkeb_10",
          question: "Bagaimana volume suara musik di toko?",
          keterangan: "Suasana Toko",
        },
        {
          key: "lingkeb_11",
          question: "Seberapa nyaman suhu di toko?",
          keterangan: "Suasana Toko",
        },
        { isTotalScore: true },
      ],
    },
    {
      category: "Pelayanan",
      bobot: "20%",
      fields: [
        {
          key: "pel_1",
          question: "Berapa lama waktu yang diperlukan untuk Anda disalami saat memasuki toko?",
          keterangan: "Salam Pembukaan",
        },
        {
          key: "pel_2",
          question: "Bagaimana Anda menilai keramahan staf yang menyapa Anda?",
          keterangan: "Salam Pembukaan",
        },
        {
          key: "pel_3",
          question: "Bagaimana Anda menilai penampilan staf yang sedang bekerja?",
          keterangan: "Salam Pembukaan",
        },
        {
          key: "pel_4",
          question: "Bagaimana Anda menilai standard kerapihan seragam staf yang sedang bekerja?",
          keterangan: "Salam Pembukaan",
        },
        {
          key: "pel_5",
          question: "Apakah kasir mengulangi pesanan anda dengan lengkap dan akurat?",
          keterangan: "Pengambilan Pesanan",
        },
        {
          key: "pel_6",
          question: "Apakah kasir menawarkan aplikasi?",
          keterangan: "Pengambilan Pesanan",
        },
        {
          key: "pel_7",
          question: "Apakah kasir melakukan upselling: menawarkan promo/upsize/topping/dll ?",
          keterangan: "Pengambilan Pesanan",
        },
        {
          key: "pel_8",
          question: "Apakah kasir memberikan struk sesuai pesanan?",
          keterangan: "Pengambilan Pesanan",
        },
        {
          key: "pel_9",
          question: "Seberapa paham kasir tentang menu?",
          keterangan: "Pengambilan Pesanan",
        },
        {
          key: "pel_10",
          question: "Apakah kasir mengucapkan terima kasih setelah transaksi?",
          keterangan: "Pengambilan Pesanan",
        },
        { isTotalScore: true },
      ],
    },
    {
      category: "Kecepatan & Efiensi",
      bobot: "20%",
      fields: [
        {
          key: "kec_1",
          question: "Berapa lama waktu yang dibutuhkan untuk menyelesaikan pesanan Anda (1 minuman dan 1 makanan) setelah struk dikeluarkan?",
          keterangan: "Waktu Penyelesaian Pesanan",
        },
        {
          key: "kec_2",
          question: "Seberapa akurat spesifikasi minuman Anda (kustomisasi minuman)?",
          keterangan: "Waktu Penyelesaian Pesanan",
        },
        {
          key: "kec_3",
          question: "Seberapa akurat spesifikasi makanan Anda?",
          keterangan: "Waktu Penyelesaian Pesanan",
        },
        {
          key: "kec_4",
          question: "Apakah staff memanggil nama Anda ketika memberikan pesanan?",
          keterangan: "Waktu Penyelesaian Pesanan",
        },
        { isTotalScore: true },
      ],
    },
    {
      category: "Kualitas Produk",
      bobot: "25%",
      fields: [
        {
          key: "kual_1",
          question: "Bagaimana Anda menilai rasa kopi/minuman Anda?",
          keterangan: "Kualitas Kopi & Minuman",
        },
        {
          key: "kual_2",
          question: "Apakah kopi disajikan pada suhu yang tepat sesuai pesanan? (Panas / Dingin)",
          keterangan: "Kualitas Kopi & Minuman",
        },
        {
          key: "kual_3",
          question: "Apakah presentasi produk Minuman yang disajikan tidak berantakan?",
          keterangan: "Kualitas Kopi & Minuman",
        },
        {
          key: "kual_4",
          question: "Apakah ada label order pada minuman yang disajikan?",
          keterangan: "Kualitas Kopi & Minuman",
        },
        {
          key: "kual_5",
          question: "Bagaimana Anda menilai rasa makanan Anda?",
          keterangan: "Kualitas Makanan",
        },
        {
          key: "kual_6",
          question: "Apakah makanan disajikan pada suhu dan tekstur yang tepat?",
          keterangan: "Kualitas Makanan",
        },
        {
          key: "kual_7",
          question: "Apakah presentasi produk Makanan yang disajikan tidak berantakan?",
          keterangan: "Kualitas Makanan",
        },
        {
          key: "kual_8",
          question: "Apakah ada label order pada makanan yang disajikan?",
          keterangan: "Kualitas Makanan",
        },
        { isTotalScore: true },
      ],
    },
    {
      category: "Pengalaman Secara Keseluruhan",
      bobot: "25%",
      fields: [
        {
          key: "peng_1",
          question: "Apakah staff mengucapkan 'terima kasih janji datang kembali' ketika Anda meninggalkan toko?",
          keterangan: "Kepuasan Secara Keseluruhan",
        },
        {
          key: "peng_2",
          question: "Seberapa puas Anda dengan pengalaman Anda secara keseluruhan di toko ini?",
          keterangan: "Kepuasan Secara Keseluruhan",
        },
        {
          key: "peng_3",
          question: "Seberapa besar kemungkinan Anda untuk kembali ke toko ini?",
          keterangan: "Kemungkinan untuk Kembali",
        },
        {
          key: "peng_4",
          question: "Seberapa besar kemungkinan Anda untuk merekomendasikan toko ini kepada orang lain?",
          keterangan: "Kemungkinan untuk Merekomendasikan",
        },
        { isTotalScore: true },
      ],
    },
  ];

  const getDescription = (column: string, point: number): string => {
    const descriptions: Record<string, Record<number, string>> = {
      lingkeb: {
        5: "Ya, semua",
        4: "Bersih",
        3: "Netral",
        2: "Cukup Kotor",
        1: "Tidak ada",
      },
      pel: {
        5: "Ya",
        4: "Baik",
        3: "Netral",
        2: "Kurang",
        1: "Tidak",
      },
      kec: {
        5: "Sangat Baik",
        4: "Baik",
        3: "Netral",
        2: "Buruk",
        1: "Sangat Buruk",
      },
      kual: {
        5: "Sangat Baik",
        4: "Baik",
        3: "Netral",
        2: "Buruk",
        1: "Sangat Buruk",
      },
      peng: {
        5: "Sangat Mungkin",
        4: "Mungkin",
        3: "Netral",
        2: "Tidak Mungkin",
        1: "Sangat Tidak Mungkin",
      },
    };

    if (column.startsWith("lingkeb_")) {
      const key = column;
      if (key === "lingkeb_1" && point === 3) {
        return "Sebagian";
      }
      if (key === "lingkeb_2" && point === 3) {
        return "Sebagian";
      }
      if (key === "lingkeb_3" && point === 1) {
        return "Sangat Kotor";
      }
      if (key === "lingkeb_5" && point === 1) {
        return "Sangat Berantakan";
      }
      if (key === "lingkeb_6" && point === 1) {
        return "Sangat Berantakan";
      }
      if (key === "lingkeb_5" && point === 2) {
        return "Berantakan";
      }
      if (key === "lingkeb_6" && point === 2) {
        return "Berantakan";
      }
      if (key === "lingkeb_5" && point === 4) {
        return "Rapih";
      }
      if (key === "lingkeb_6" && point === 4) {
        return "Rapih";
      }
      if (key === "lingkeb_5" && point === 5) {
        return "Sangat Rapih";
      }
      if (key === "lingkeb_6" && point === 5) {
        return "Sangat Rapih";
      }
      if (key === "lingkeb_7" && point === 1) {
        return "Sangat Kotor";
      }
      if (key === "lingkeb_7" && point === 5) {
        return "Sangat Bersih";
      }
      if (key === "lingkeb_8" && point === 1) {
        return "Tidak ada Perlengkapan";
      }
      if (key === "lingkeb_8" && point === 2) {
        return "Kurang Lengkap";
      }
      if (key === "lingkeb_8" && point === 4) {
        return "Lengkap";
      }
      if (key === "lingkeb_8" && point === 5) {
        return "Sangat Lengkap";
      }
      if (key === "lingkeb_9" && point === 1) {
        return "Sangat Buruk";
      }
      if (key === "lingkeb_9" && point === 2) {
        return "Buruk";
      }
      if (key === "lingkeb_9" && point === 4) {
        return "Baik";
      }
      if (key === "lingkeb_9" && point === 5) {
        return "Sangat Baik";
      }
      if (key === "lingkeb_10" && point === 1) {
        return "Terlalu Besar/Tidak Menyala";
      }
      if (key === "lingkeb_10" && point === 5) {
        return "Menyala dan Pas";
      }
      if (key === "lingkeb_11" && point === 1) {
        return "Panas";
      }
      if (key === "lingkeb_11" && point === 2) {
        return "Tidak Nyaman";
      }
      if (key === "lingkeb_11" && point === 4) {
        return "Nyaman";
      }
      if (key === "lingkeb_11" && point === 5) {
        return "Sangat Nyaman";
      }
    }

    if (column.startsWith("pel_")) {
      const key = column;
      if (key === "pel_1" && point === 5) {
        return "Langsung";
      }
      if (key === "pel_1" && point === 3) {
        return "1 - 2 menit";
      }
      if (key === "pel_1" && point === 1) {
        return "Tidak Disalami";
      }
      if (key === "pel_2" && point === 1) {
        return "Tidak Ramah";
      }
      if (key === "pel_2" && point === 5) {
        return "Ramah";
      }
      if (key === "pel_3" && point === 1) {
        return "Sangat Tidak Rapih";
      }
      if (key === "pel_3" && point === 2) {
        return "Tidak Rapih";
      }
      if (key === "pel_3" && point === 4) {
        return "Rapih";
      }
      if (key === "pel_3" && point === 5) {
        return "Sangat Rapih";
      }
      if (key === "pel_4" && point === 1) {
        return "Tidak Sesuai Standard";
      }
      if (key === "pel_4" && point === 5) {
        return "Sesuai Standard";
      }
      if (key === "pel_9" && point === 1) {
        return "Tidak Paham";
      }
      if (key === "pel_9" && point === 5) {
        return "Paham";
      }
    }

    if (column.startsWith("kec_")) {
      const key = column;
      if (key === "kec_1" && point === 5) {
        return "Kurang dari 8 menit";
      }
      if (key === "kec_1" && point === 3) {
        return "1 - 2 menit";
      }
      if (key === "kec_1" && point === 1) {
        return "Lebih dari 15 menit";
      }
      if (key === "kec_4" && point === 5) {
        return "Ya";
      }
      if (key === "kec_4" && point === 1) {
        return "Tidak";
      }
    }

    if (column.startsWith("kual_")) {
      const key = column;
      if (key === "kual_2" && point === 5) {
        return "Ya";
      }
      if (key === "kual_2" && point === 1) {
        return "Tidak";
      }
      if (key === "kual_3" && point === 1) {
        return "Ya Berantakan";
      }
      if (key === "kual_3" && point === 5) {
        return "Tidak Berantakan";
      }
      if (key === "kual_4" && point === 1) {
        return "Tidak Ada";
      }
      if (key === "kual_4" && point === 5) {
        return "Ada";
      }
      if (key === "kual_6" && point === 5) {
        return "Ya";
      }
      if (key === "kual_6" && point === 1) {
        return "Tidak";
      }
      if (key === "kual_7" && point === 1) {
        return "Ya Berantakan";
      }
      if (key === "kual_7" && point === 5) {
        return "Tidak Berantakan";
      }
      if (key === "kual_8" && point === 1) {
        return "Tidak Ada";
      }
      if (key === "kual_8" && point === 5) {
        return "Ada";
      }
    }

    if (column.startsWith("peng_")) {
      const key = column;
      if (key === "peng_1" && point === 5) {
        return "Ya";
      }
      if (key === "peng_1" && point === 1) {
        return "Tidak";
      }
      if (key === "peng_2" && point === 5) {
        return "Sangat Puas";
      }
      if (key === "peng_2" && point === 4) {
        return "Puas";
      }
      if (key === "peng_2" && point === 2) {
        return "Tidak Puas";
      }
      if (key === "peng_2" && point === 1) {
        return "Sangat Tidak Puas";
      }
    }

    const category = Object.keys(descriptions).find((key) => column.startsWith(key));

    if (category && descriptions[category] && typeof point === "number") {
      return descriptions[category][point] ?? "-";
    }

    return "-";
  };

  const tableData: any[][] = [];
  let questionNumber = 1;
  let grandTotalScore = 0;

  questions.forEach((section) => {
    tableData.push([
      {
        content: section.category,
        colSpan: 6,
        styles: {
          halign: "center",
          fillColor: [200, 200, 200],
          fontStyle: "bold",
        },
      },
    ]);

    let totalScore = 0;

    section.fields.forEach((field) => {
      if (field.isTotalScore) {
        const questionResults: Record<string, { totalScore: number }> = {
          "Lingkungan Kebersihan": { totalScore: row.total_lingkeb },
          Pelayanan: { totalScore: row.total_pel },
          "Kecepatan & Efiensi": { totalScore: row.total_kec },
          "Kualitas Produk": { totalScore: row.total_kual },
          "Pengalaman Secara Keseluruhan": { totalScore: row.total_peng },
        };
        const dbTotalScore = questionResults[section.category].totalScore;

        tableData.push([
          {
            content: `${section.category} (BOBOT ${section.bobot})`,
            colSpan: 5,
            styles: {
              halign: "center",
              fillColor: [173, 216, 230],
              fontStyle: "bold",
            },
          },
          {
            content: `${dbTotalScore}`,
            styles: {
              halign: "center",
              fillColor: [173, 216, 230],
              fontStyle: "bold",
            },
          },
        ]);
        grandTotalScore += totalScore;
      } else {
        const point = field.key ? Number(row[field.key] || 0) : 0;
        const score = point * 0.1;
        totalScore += score;

        const desc = getDescription(field.key || "", point);

        tableData.push([questionNumber++, field.keterangan, field.question, point, desc, score.toFixed(2)]);
      }
    });
  });

  tableData.push([
    {
      content: "Total Score",
      colSpan: 5,
      styles: { halign: "left", fillColor: [255, 223, 186], fontStyle: "bold" },
    },
    {
      content: row.total_score, // Total dari semua kategori
      styles: {
        halign: "center",
        fillColor: [255, 223, 186],
        fontStyle: "bold",
      },
    },
  ]);

  tableData.push([
    {
      content: "Percentage", // Title untuk percentage
      colSpan: 5,
      styles: { halign: "left", fillColor: [255, 223, 186], fontStyle: "bold" },
    },
    {
      content: `${row.percentage}%`,
      styles: {
        halign: "center",
        fillColor: [255, 223, 186],
        fontStyle: "bold",
      },
    },
  ]);

  tableData.push([
    {
      content: "Antrian",
      colSpan: 5,
      styles: { halign: "left", fillColor: [255, 223, 186], fontStyle: "bold" },
    },
    {
      content: row.antrian,
      styles: {
        halign: "center",
        fillColor: [255, 223, 186],
        fontStyle: "bold",
      },
    },
  ]);

  tableData.push([
    {
      content: "Total Crew",
      colSpan: 5,
      styles: { halign: "left", fillColor: [255, 223, 186], fontStyle: "bold" },
    },
    {
      content: row.total_crew,
      styles: {
        halign: "center",
        fillColor: [255, 223, 186],
        fontStyle: "bold",
      },
    },
  ]);

  tableData.push([
    {
      content: "Waktu masuk store sampai mendapatkan produk",
      colSpan: 5,
      styles: { halign: "left", fillColor: [255, 223, 186], fontStyle: "bold" },
    },
    {
      content: row.time_1,
      styles: {
        halign: "center",
        fillColor: [255, 223, 186],
        fontStyle: "bold",
      },
    },
  ]);

  tableData.push([
    {
      content: "Service Time",
      colSpan: 5,
      styles: { halign: "left", fillColor: [255, 223, 186], fontStyle: "bold" },
    },
    {
      content: row.time_2,
      styles: {
        halign: "center",
        fillColor: [255, 223, 186],
        fontStyle: "bold",
      },
    },
  ]);

  tableData.push([
    {
      content: "Nominal Struk",
      colSpan: 5,
      styles: { halign: "left", fillColor: [255, 223, 186], fontStyle: "bold" },
    },
    {
      content: formatRupiah(row.nominal_struk),
      styles: {
        halign: "center",
        fillColor: [255, 223, 186],
        fontStyle: "bold",
      },
    },
  ]);

  // Summary
  tableData.push([
    {
      content: "Apa yang paling Anda sukai dari kunjungan Anda?",
      colSpan: 2,
      styles: { halign: "left", fillColor: [240, 240, 240] },
    },
    {
      content: row[`summary_1`] || "-",
      colSpan: 4,
      styles: { halign: "left" },
    },
  ]);

  tableData.push([
    {
      content: "Apa yang perlu diperbaiki? ",
      colSpan: 2,
      styles: { halign: "left", fillColor: [240, 240, 240] },
    },
    {
      content: row[`summary_2`] || "-",
      colSpan: 4,
      styles: { halign: "left" },
    },
  ]);

  tableData.push([
    {
      content: "Ada komentar atau saran lainnya?",
      colSpan: 2,
      styles: { halign: "left", fillColor: [240, 240, 240] },
    },
    {
      content: row[`summary_3`] || "-",
      colSpan: 4,
      styles: { halign: "left" },
    },
  ]);

  let isFirstPage = 0;

  autoTable(doc, {
    head: [["No", "Keterangan", "Questions", "Poin", "Desc", "Score"]],
    body: tableData,
    startY: yPosition + 10,
    styles: { fontSize: 10, lineColor: [200, 200, 200], lineWidth: 0.2 },
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 30 },
      5: { cellWidth: 25, halign: "center" },
    },
    tableWidth: "wrap",
    didDrawPage: function (data) {
      if (!isFirstPage) {
        (data.table.head as any) = [];
      }
      isFirstPage = 0;
    },
  });

  // Fungsi untuk menambahkan gambar setelah tabel
  const addImagesToPdf = (doc: jsPDF, images: { title: string; imageData: string }[], startY: number) => {
    console.log(images);
    let yPosition = startY;

    images.forEach((image, index) => {
      // Jika gambar melebihi batas bawah halaman, tambahkan halaman baru
      if (yPosition + 51 > doc.internal.pageSize.height) {
        doc.addPage();
        yPosition = 10;
      }

      // Menambahkan nomor gambar di sebelah kiri
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${image.title}`, 20, yPosition);
      yPosition += 5;

      // Menambahkan gambar di sebelah kanan
      const pageWidth = doc.internal.pageSize.width;
      doc.addImage(image.imageData, "JPEG", pageWidth - 100, yPosition - 10, 80, 90); // Menambahkan gambar di kanan
      yPosition += 93;
    });

    return yPosition;
  };

  // Ambil gambar dari database dan pastikan formatnya base64
  const images = [
    { title: "Struk Pembelian", imageData: row.image_struk }, // Pastikan image_struk adalah base64
    { title: "Produk", imageData: row.image_product }, // Pastikan image_product adalah base64
    { title: "Tempat Duduk", imageData: row.image_td }, // Pastikan image_td adalah base64
    { title: "Lainnya", imageData: row.image_lainnya }, // Pastikan image_lainnya adalah base64
  ];

  // Tambahkan gambar setelah tabel
  yPosition = addImagesToPdf(doc, images, yPosition + 200);

  try {
    doc.save(
      `${row.kode_gerai}_${new Date(row.createdAt)
        .toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "numeric",
          year: "numeric",
        })
        .replace(/\//g, "-")}_${row.store_name}_${row.area}.pdf`
    );
  } catch (error) {
    console.error("Error saat membuat PDF:", error);
  } finally {
    setLoading(false); // Set loading ke false setelah selesai
  }
};

export const handleSingleDownloadDarmi = async (row: ProductDarmi, setLoading: React.Dispatch<React.SetStateAction<boolean>>) => {
  setLoading(true);
  console.log(row);
  const doc = new jsPDF();

  const logo1Url = "/images/logos/topan.png";
  const logo2Url = "/images/logos/darmi.png";

  const loadImageToBase64 = async (url: string | URL | Request) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  try {
    const logo1Base64: string = (await loadImageToBase64(logo1Url)) as string;
    const logo2Base64: string = (await loadImageToBase64(logo2Url)) as string;
    doc.addImage(logo1Base64, "PNG", 10, 15, 40, 10);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(logo2Base64, "PNG", pageWidth - 40, 5, 30, 25);
  } catch (error) {
    console.error("Gagal memuat logo:", error);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CHECKLIST MYSTERY SHOPPER MBOKDARMI", 105, 45, { align: "center" });

  const detailData = [
    { label: "Nama", value: row.nama_agent },
    {
      label: "Hari/Tanggal",
      value: new Date(row.createdAt)
        .toLocaleDateString("id-ID", {
          //     weekday: "long", // Nama hari dalam format panjang (misal: Senin, Selasa)
          day: "2-digit", // Menampilkan hari dengan 2 digit
          month: "long", // Menampilkan bulan dalam format panjang (misal: Januari, Februari)
          year: "numeric", // Menampilkan tahun
        })
        .replace(/, /g, " / "),
    },
    {
      label: "Jam",
      value: new Date(row.createdAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    },
    { label: "Store", value: row.store_name },
    { label: "Menu", value: row.menu },
    { label: "Area", value: row.area },
  ];

  let yPosition = 60;

  detailData.forEach((item) => {
    doc.setFontSize(12);
    const wrappedText = doc.splitTextToSize(`${String(item.value) || "-"}`, 120); // Sesuaikan 120 dengan max width

    doc.text(`${item.label}`, 15, yPosition);
    doc.text(`:`, 65, yPosition);
    doc.text(wrappedText, 70, yPosition, { align: "left" });
    yPosition += wrappedText.length * 6;
  });

  const questions = [
    {
      category: "Product",
      fields: [
        {
          key: "pkem1",
          question: "Produk dilengkapi dengan sedotan yang sesuai dengan varian yang dipesan?",
        },
        {
          key: "pkem2",
          question: "Produk diseal dengan baik",
        },
        {
          key: "pfs1",
          question: "Produk bebas dari benda asing",
        },
        {
          key: "pfs2",
          question: "Produk tidak terasa basi atau berbau",
        },
        {
          key: "pkp1",
          question: "Apakah seluruh menu dalam daftar tersedia?",
        },
      ],
    },
    {
      category: "Cashier",
      fields: [
        {
          key: "scas1",
          question: "Greetings awal",
        },
        {
          key: "scas2",
          question: "Suara dairysta terdengar dengan jelas",
        },
        {
          key: "scas3",
          question: "Dairysta senyum saat menyapa customer",
        },
        {
          key: "scas4",
          question: "Penyebutan produk best seller/rekomendasi",
        },
        {
          key: "scas5",
          question: "Penawaran promo yang sedang berlangsung ",
        },
        {
          key: "scas6",
          question: "Penawaran upsize cup ",
        },
        {
          key: "scas7",
          question: "Penawaran tambahan produk lainnya ",
        },
        {
          key: "scas8",
          question: "Penawaran topping ",
        },
        {
          key: "scas9",
          question: "Menanyakan gula dan es batu ",
        },
        {
          key: "scas10",
          question: "Penawaran tropicana slim ",
        },
        {
          key: "scas11",
          question: "Penawaran tas tenteng ",
        },
        {
          key: "scas12",
          question: "Mengkonfirmasi pesanan customer ",
        },
        {
          key: "scas13",
          question: "Penawaran membership ",
        },
        {
          key: "scas14",
          question: "Menerima pembayaran dengan pecahan 50.000/100.000 ",
        },
        {
          key: "scas15",
          question: "Menggunakan money detector ",
        },
        {
          key: "scas16",
          question: "Struk diberikan ke customer ",
        },
        {
          key: "scas17",
          question: "Menginformasikan promo struk ",
        },
        {
          key: "scas18",
          question: "Mengarahkan customer ke bagian pick up ",
        },
        {
          key: "scas19",
          question: "Menutup transaksi dengan mengucapkan 'terima kasih' ",
        },
      ],
    },
    {
      category: "Process",
      fields: [
        {
          key: "spro1",
          question: "Dairysta yag meracik menggunakan handglove ",
        },
        {
          key: "spro2",
          question: "Penulisan keterangan rasa dan lainnya di cup ",
        },
        {
          key: "spro3",
          question: "Dairysta yang meracik merasakan susu di gelas sloki ",
        },
        {
          key: "spro4",
          question: "Urutan penyajian di dalam cup benar ",
        },
      ],
    },
    {
      category: "Serving",
      fields: [
        {
          key: "sser1",
          question: "Pengecekan cup (dibalikkan) ",
        },
        {
          key: "sser2",
          question: "Penyebutan nomor antrian ",
        },
        {
          key: "sser3",
          question: "Pengecekan kembali kesesuaian pesanan ",
        },
        {
          key: "sser4",
          question: "Dairysta senyum saat memberikan pesanan ",
        },
        {
          key: "sser5",
          question: "Greetings akhir ",
        },
        {
          key: "sser6",
          question: "Dairysta yang menyerahkan menggunakan handglove ",
        },
      ],
    },
    {
      category: "People",
      fields: [
        {
          key: "speo1",
          question: "Rambut Rapi ",
        },
        {
          key: "speo2",
          question: "Memakai Sepatu ",
        },
        {
          key: "speo3",
          question: "Memakai Topi ",
        },
        {
          key: "speo4",
          question: "Memakai Celemek ",
        },
        {
          key: "speo5",
          question: "Memakai ikat pinggang ",
        },
        {
          key: "speo6",
          question: "Memakai Pin Di Sebelah Kanan ",
        },
        {
          key: "speo7",
          question: "Memakai Id Card Di Sebelah Kiri ",
        },
        {
          key: "speo8",
          question: "Baju dimasukkan kecuali batik ",
        },
      ],
    },
    {
      category: "Tampilan Outlet",
      fields: [
        {
          key: "tto1",
          question: "Display menu terpasang dengan baik ",
        },
        {
          key: "tto2",
          question: "Banner promo terpasang dengan baik ",
        },
        {
          key: "tto3",
          question: "Papan tanda terpasang jelas dan baik ",
        },
        {
          key: "tto4",
          question: "Informasi kebijakan halal terlihat dengan jelas ",
        },
        {
          key: "tto5",
          question: "Informasi 'Pembelian tanpa struk, Gratis' terlihat dengan jelas ",
        },
        {
          key: "tto6",
          question: "Informasi QR keluhan customer terlihat dengan jelas ",
        },
        {
          key: "tto7",
          question: "Informasi QR membership ",
        },
        {
          key: "tto8",
          question: "Media pada akrilik tidak kosong ",
        },
        {
          key: "tto9",
          question: "Semua pencahayaan beroperasi dengan baik ",
        },
        {
          key: "tto10",
          question: "Video pada TV berjalan ",
        },
      ],
    },
    {
      category: "Cleanness",
      fields: [
        {
          key: "clc1",
          question: "Display menu bersih ",
        },
        {
          key: "clc2",
          question: "Akrilik Bersih ",
        },
        {
          key: "clc3",
          question: "Banner promo bersih ",
        },
        {
          key: "clc4",
          question: "Papan tanda bersih ",
        },
        {
          key: "clc5",
          question: "Lampu bersih ",
        },
        {
          key: "clc6",
          question: "Tampilan sisi luar outlet bersih (Fasad) ",
        },
        {
          key: "clc7",
          question: "Tempat sampah kecil bersih dan tidak bau ",
        },
        {
          key: "clc8",
          question: "Isi tempat sampah kecil ",
        },
        {
          key: "clc9",
          question: "Neon box bersih ",
        },
        {
          key: "clc10",
          question: "Signage bersih ",
        },
        {
          key: "clc11",
          question: "Lantai dalam outlet kering dan bersih ",
        },
        {
          key: "clc12",
          question: "Meja kerja bersih ",
        },
        {
          key: "clc13",
          question: "Meja kerja bebas dari perlengkapan pribadi ",
        },
        {
          key: "clc14",
          question: "Isi tempat sampah dalam outlet ",
        },
        {
          key: "clc15",
          question: "Tempat sampah dalam outlet tertutup ",
        },
        {
          key: "clc16",
          question: "Sink bersih dan tidak berkerak ",
        },
        {
          key: "clc17",
          question: "Outlet bebas dari bau tidak sedap ",
        },
        {
          key: "clc18",
          question: "Outlet bebas hama ",
        },
        {
          key: "clc19",
          question: "Alat kebersihan bersih dan tersimpan rapi ",
        },
        {
          key: "clc20",
          question: "Kebersihan Lantai Tunggu (Sitting Area) ",
        },
      ],
    },
    {
      category: "Crew",
      fields: [
        {
          key: "crewc",
          question: "Nama Crew yang menjadi cashier ",
        },
        {
          key: "crewp",
          question: "Nama Crew yang meracik product ",
        },
        {
          key: "crews",
          question: "Nama Crew yang menyerahkan product ",
        },
        {
          key: "total_crew",
          question: "Ada berapa jumlah crew yang bertugas ",
        },
        {
          key: "hc",
          question: "Apakah crew merespons komplain dengan baik? ",
        },
        {
          key: "time_exp",
          question: "Total Experience Time ",
        },
        {
          key: "time_ser",
          question: "Service Time ",
        },
        {
          key: "antrian",
          question: "Queue",
        },
        {
          key: "kepuasan",
          question: "Kepuasan",
        },
        {
          key: "nominal_struk",
          question: "Nominal Pembelian",
        },
      ],
    },
  ];

  const tableData: any[][] = [];
  let questionNumber = 1;

  questions.forEach((section) => {
    tableData.push([
      {
        content: section.category,
        colSpan: 6,
        styles: {
          halign: "center",
          fillColor: [200, 200, 200],
          fontStyle: "bold",
        },
      },
    ]);

    section.fields.forEach((field) => {
      if (field.key) {
        let value = row[field.key];

        if (field.key === "nominal_struk") {
          value = formatRupiah(value);
        }

        tableData.push([questionNumber++, field.question, value]);
      }
    });
  });

  // 1️⃣ Render Tabel Utama
  autoTable(doc, {
    head: [["No", "Questions", "Value"]],
    body: tableData,
    startY: yPosition + 10,
    styles: { fontSize: 10, lineColor: [200, 200, 200], lineWidth: 0.2 },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 130 },
      2: { cellWidth: 40, halign: "center" },
    },
    tableWidth: "wrap",
  });

  // 2️⃣ Ambil Posisi Y Setelah Tabel
  let summaryY = (doc as any).lastAutoTable.finalY;

  // Tabel 1: Total Score, Percentage, Antrian, dll.
  autoTable(doc, {
    body: [
      [
        {
          content: "% Product",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: `${row.product_percentage}%`,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
      ],
      [
        {
          content: "% Cashier",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: `${row.cashier_percentage}%`,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
      ],
      [
        {
          content: "% Process",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: `${row.process_percentage}%`,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
      ],
      [
        {
          content: "% People",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: `${row.people_percentage}%`,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
      ],
      [
        {
          content: "% Outlet",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: `${row.outlet_percentage}%`,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
      ],
      [
        {
          content: "% Clean",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: `${row.clean_percentage}`,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
      ],
      [
        {
          content: "% All",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: `${row.total_percentage}%`,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        // { content: formatRupiah(row.nominal_struk), styles: { halign: "center", fillColor: [255, 223, 186], fontStyle: "bold" } },
      ],
    ],
    startY: summaryY,
    styles: { fontSize: 10, lineColor: [200, 200, 200], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 40 },
    },
    tableWidth: "wrap",
  });

  // Ambil posisi terakhir tabel pertama
  let newTableY = (doc as any).lastAutoTable.finalY + 0; // Tambah sedikit padding

  // Tabel 2: Catatan/Temuan, Penjelasan Complaint, Rekomendasi
  autoTable(doc, {
    body: [
      [
        {
          content: "CATATAN / TEMUAN",
          styles: {
            halign: "left",
            fillColor: [240, 240, 240],
            fontStyle: "bold",
          },
        },
        { content: row["catatan"] || "-", styles: { halign: "left" } },
      ],
      [
        {
          content: "PENJELASAN COMPLAINT",
          styles: {
            halign: "left",
            fillColor: [240, 240, 240],
            fontStyle: "bold",
          },
        },
        { content: row["penjelasan_comp"] || "-", styles: { halign: "left" } },
      ],
      [
        {
          content: "REKOMENDASI",
          styles: {
            halign: "left",
            fillColor: [240, 240, 240],
            fontStyle: "bold",
          },
        },
        { content: row["rekomendasi"] || "-", styles: { halign: "left" } },
      ],
    ],
    startY: newTableY, // Mulai setelah tabel pertama
    styles: { fontSize: 10, lineColor: [200, 200, 200], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 110 },
    },
    tableWidth: "wrap",
  });

  // Fungsi untuk menambahkan gambar setelah tabel
  const addImagesToPdf = (doc: jsPDF, images: { title: string; imageData: string }[], startY: number) => {
    console.log(images);
    let yPosition = startY;

    images.forEach((image, index) => {
      // Jika gambar melebihi batas bawah halaman, tambahkan halaman baru
      if (yPosition + 51 > doc.internal.pageSize.height) {
        doc.addPage();
        yPosition = 10;
      }

      // Menambahkan nomor gambar di sebelah kiri
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${image.title}`, 20, yPosition);
      yPosition += 5;

      // Menambahkan gambar di sebelah kanan
      const pageWidth = doc.internal.pageSize.width;
      doc.addImage(image.imageData, "JPEG", pageWidth - 100, yPosition - 10, 80, 90); // Menambahkan gambar di kanan
      yPosition += 93;
    });

    return yPosition;
  };

  // Ambil gambar dari database dan pastikan formatnya base64
  const images = [
    { title: "Image Product", imageData: row.img_product }, // Pastikan image_struk adalah base64
    { title: "Image Struk", imageData: row.img_petugas }, // Pastikan image_product adalah base64
    { title: "Lainnya", imageData: row.img_dll }, // Pastikan image_lainnya adalah base64
  ];

  // Tambahkan gambar setelah tabel
  yPosition = addImagesToPdf(doc, images, yPosition + 200);

  try {
    doc.save(
      `${row.kode_gerai}_${new Date(row.createdAt)
        .toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "numeric",
          year: "numeric",
        })
        .replace(/\//g, "-")}_${row.store_name}_${row.area}.pdf`
    );
  } catch (error) {
    console.error("Error saat membuat PDF:", error);
  } finally {
    setLoading(false); // Set loading ke false setelah selesai
  }
};

export const handleSingleDownloadHausGerai = async (row: ProductDarmi, setLoading: React.Dispatch<React.SetStateAction<boolean>>) => {
  setLoading(true);
  console.log(row);
  const doc = new jsPDF();

  const logo1Url = "/images/logos/topan.png";
  const logo2Url = "/images/logos/haus-logo.png";

  const loadImageToBase64 = async (url: string | URL | Request) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  try {
    const logo1Base64: string = (await loadImageToBase64(logo1Url)) as string;
    const logo2Base64: string = (await loadImageToBase64(logo2Url)) as string;
    doc.addImage(logo1Base64, "PNG", 10, 15, 40, 10);
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(logo2Base64, "PNG", pageWidth - 40, 10, 30, 15);
  } catch (error) {
    console.error("Gagal memuat logo:", error);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CHECKLIST MYSTERY SHOPPER", 105, 45, { align: "center" });

  const detailData = [
    { label: "Nama", value: row.nama_agent },
    {
      label: "Hari/Tanggal",
      value: new Date(row.createdAt)
        .toLocaleDateString("id-ID", {
          //     weekday: "long", // Nama hari dalam format panjang (misal: Senin, Selasa)
          day: "2-digit", // Menampilkan hari dengan 2 digit
          month: "long", // Menampilkan bulan dalam format panjang (misal: Januari, Februari)
          year: "numeric", // Menampilkan tahun
        })
        .replace(/, /g, " / "),
    },
    {
      label: "Jam",
      value: new Date(row.createdAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    },
    { label: "Store", value: row.store_name || row.store },
    { label: "Store Type", value: row.store_type },
    { label: "Menu", value: row.menu },
    { label: "Area", value: row.area },
  ];

  let yPosition = 60;

  detailData.forEach((item) => {
    doc.setFontSize(12);
    const wrappedText = doc.splitTextToSize(`${String(item.value) || "-"}`, 120); // Sesuaikan 120 dengan max width

    doc.text(`${item.label}`, 15, yPosition);
    doc.text(`:`, 65, yPosition);
    doc.text(wrappedText, 70, yPosition, { align: "left" });
    yPosition += wrappedText.length * 6;
  });

  const questions = [
    {
      fields: [
        {
          key: "A1001",
          keterangan: "Minuman",
          question: "Apakah rasa produk sesuai? (Kurang manis, Terlalu manis, atau Hambar)",
        },
        {
          key: "A1002",
          keterangan: "Minuman",
          question: "Apakah tampilan / Warna produk sesuai? ",
        },
        {
          key: "A1003",
          keterangan: "Minuman",
          question: "Apakah tekstur sesuai dengan produk? ",
        },
        {
          key: "A1004",
          keterangan: "Minuman",
          question: "Apakah produk dilengkapi sedotan dan sesuai varian yang dipesan ? ",
        },
        {
          key: "A1005",
          keterangan: "Minuman",
          question: "Apakah produk diseal dengan baik ? ",
        },
        {
          key: "A1006",
          keterangan: "Minuman",
          question: "Apakah produk ditempel sticker varian produk ? ",
        },
        {
          key: "A1007",
          keterangan: "Minuman",
          question: "Apakah produk bebas dari benda asing? ",
        },
        {
          key: "A1008",
          keterangan: "Minuman",
          question: "Apakah produk tidak terasa basi atau berbau? ",
        },
        {
          key: "A1009",
          keterangan: "Service & Ambience",
          question: "Apakah cashier menyapa customer yang datang?  ",
        },
        {
          key: "A1010",
          keterangan: "Service & Ambience",
          question: "Apakah suara cashier terdengar dengan jelas?  ",
        },
        {
          key: "A1011",
          keterangan: "Service & Ambience",
          question: "Apakah Cashier melayani dengan senyum?  ",
        },
        {
          key: "A1012",
          keterangan: "Service & Ambience",
          question: "Apakah cashier menanyakan nama customer?  ",
        },
        {
          key: "A1013",
          keterangan: "Service & Ambience",
          question: "Apakah cashier menanyakan orderan customer?  ",
        },
        {
          key: "A1014",
          keterangan: "Service & Ambience",
          question: "Apakah cashier melakukan up selling dengan menawarkan promo yang berlangsung? ",
        },
        {
          key: "A1015",
          keterangan: "Service & Ambience",
          question: "Apakah cashier menyebutkan ulang pesanan customer?  ",
        },
        {
          key: "A1016",
          keterangan: "Service & Ambience",
          question: "Apakah cashier menanyakan metode pembayaran?  ",
        },
        {
          key: "A1017",
          keterangan: "Service & Ambience",
          question: "Apakah cashier menggunakan Topi & Apron? (Hijab: Tanpa Topi) (Non Hijab: Dengan Topi) ",
        },
        {
          key: "A1018",
          keterangan: "Service & Ambience",
          question: "Apakah cashier memberikan struk?  ",
        },
        {
          key: "A1019",
          keterangan: "Service & Ambience",
          question: "Apakah cashier menutup transaksi dengan meminta customer untuk menunggu dan mengucapkan terima kasih?",
        },
        {
          key: "A1020",
          keterangan: "Service & Ambience",
          question: "Apakah crew store memanggil nama customer dengan jelas? (bukan nomor struk)",
        },
        {
          key: "A1021",
          keterangan: "Service & Ambience",
          question: "Apakah crew store menyebutkan kembali orderan?  ",
        },
        {
          key: "A1022",
          keterangan: "Service & Ambience",
          question: "Apakah crew store menggunakan Topi & Apron? (Hijab: Tanpa Topi) (Non Hijab: Menggunakan Topi)",
        },
        {
          key: "A1023",
          keterangan: "Service & Ambience",
          question: "Apakah crew store mengucapkan terima kasih dan salam perpisahan (Hati-Hati di Jalan, Jika Haus Datang Kembali)? ",
        },
        {
          key: "A1024",
          keterangan: "Service & Ambience",
          question: "Apakah area lantai teras bersih dari sampah?  ",
        },
        {
          key: "A1025",
          keterangan: "Service & Ambience",
          question: "Apakah area parkir terdapat tempat sampah?  ",
        },
        {
          key: "A1026",
          keterangan: "Service & Ambience",
          question: "Apakah sign haus dalam kondisi bersih? ",
        },
        {
          key: "A1027",
          keterangan: "Service & Ambience",
          question: "Apakah lantai lobby bagian dalam store, dalam keadaan bersih? ",
        },
        {
          key: "A1028",
          keterangan: "Service & Ambience",
          question: "Apakah kursi dan meja dalam kondisi bersih dari sisa makanan? ",
        },
        {
          key: "A1029",
          keterangan: "Service & Ambience",
          question: "Apakah ruangan store bebas dari Bau atau Aroma tidak sedap? ",
        },
        {
          key: "A1030",
          keterangan: "Service & Ambience",
          question: "Apakah Suhu ruangan sudah nyaman menurut anda? ",
        },
        {
          key: "A1031",
          keterangan: "Service & Ambience",
          question: "Apakah musik sesuai dengan volume yang baik ? ",
        },
        {
          key: "A1032",
          keterangan: "Service & Ambience",
          question: "Apakah Display Menu dalam kondisi baik dan bersih ? ",
        },
        {
          key: "A1033",
          keterangan: "Service & Ambience",
          question: "Apakah Mural Dinding / Akrilik POP dalam kondisi baik dan bersih ? ",
        },
        {
          key: "A1034",
          keterangan: "Service & Ambience",
          question: "Apakah semua pencahayaan bersih, beroperasi dengan baik ? ",
        },
        {
          key: "A1035",
          keterangan: "Service & Ambience",
          question: "Apakah AC bersih dan beroperasi dengan baik ? ",
        },
        {
          key: "A1036",
          keterangan: "Service & Ambience",
          question: "Apakah crew tidak memakai aksesoris ? (cincin/gelang) ",
        },
        {
          key: "A1037",
          keterangan: "Service & Ambience",
          question: "Apakah Kerjasama antar team terlihat saat bekerja? ",
        },
        {
          key: "A1038",
          keterangan: "Service & Ambience",
          question: "Apakah crew dengan sigap melayani customer ? ",
        },
        {
          key: "A1039",
          keterangan: "Service & Ambience",
          question: "Apakah karyawan berperilaku profesional, sopan dan santun ? ",
        },
        {
          key: "B1001",
          keterangan: "Makanan",
          question: "Apakah rasa produk sesuai? (Kurang manis, Terlalu manis, atau Hambar)",
        },
        {
          key: "B1002",
          keterangan: "Makanan",
          question: "Apakah Tampilan / Warna produk sesuai? (Terlalu Pekat, Terlalu Pucat)",
        },
        {
          key: "B1003",
          keterangan: "Makanan",
          question: "Apakah diberi topping sesuai standar?",
        },
        {
          key: "B1004",
          keterangan: "Makanan",
          question: "Apakah tekstur sesuai dengan standar? (Terlalu Keras, Terlalu Kenyal)",
        },
        {
          key: "B1005",
          keterangan: "Makanan",
          question: "Apakah tekstur Kuah/saus sesuai dengan standar? (Terlalu Kental, Terlalu Cair)",
        },
        {
          key: "B1006",
          keterangan: "Makanan",
          question: "Apakah lid penutup tertutup dengan rapat ?",
        },
        {
          key: "B1007",
          keterangan: "Makanan",
          question: "Apakah produk bebas dari benda asing?",
        },
        {
          key: "B1008",
          keterangan: "Makanan",
          question: "Apakah produk tidak terasa basi atau berbau?",
        },
      ],
    },
  ];

  const tableData: any[][] = [];
  let questionNumber = 1;

  questions.forEach((section) => {
    section.fields.forEach((field) => {
      if (field.key) {
        let value = row[field.key] || "-";
        tableData.push([questionNumber++, field.keterangan, field.key, field.question, value]);
      }
    });
  });

  // 1️⃣ Render Tabel Utama
  autoTable(doc, {
    head: [["No", "Keterangan", "Question ID", "Sugestion", "Value"]],
    body: tableData,
    startY: yPosition + 10,
    styles: { fontSize: 10, lineColor: [200, 200, 200], lineWidth: 0.2 },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 25 },
      2: { cellWidth: 25, halign: "center" },
      3: { cellWidth: 100 },
      4: { cellWidth: 20, halign: "center" },
    },
    tableWidth: "wrap",
  });

  // 2️⃣ Ambil Posisi Y Setelah Tabel
  let noteY = (doc as any).lastAutoTable.finalY;

  // Tabel 1: Total Score, Percentage, Antrian, dll.
  autoTable(doc, {
    body: [
      [
        {
          content: "Note",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: "Z1001",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: "Ada berapa jumlah crew yang bertugas",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: row.Z1001,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
      ],
      [
        {
          content: "Note",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: "Z1002",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: "Berapa lama waktu yang dibutuhkan oleh customer dari mulai masuk store, mengantri sampai dengan mendapatkan produk",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: row.Z1002,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
      ],
      [
        {
          content: "Note",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: "Z1003",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: "Berapa lama waktu yang dibutuhkan oleh customer dari mulai digreeting oleh kasir sampai dengan mendapatkan produk",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: row.Z1003,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
      ],
      [
        {
          content: "Note",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: "Z1004",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: "Ada berapa jumlah antrian yang ada?",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: row.Z1004,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
      ],
    ],
    startY: noteY,
    styles: { fontSize: 10, lineColor: [200, 200, 200], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20 },
      2: { cellWidth: 100 },
      3: { cellWidth: 40 },
    },
    tableWidth: "wrap",
  });

  // 2️⃣ Ambil Posisi Y Setelah Tabel
  let summaryY = (doc as any).lastAutoTable.finalY;

  // Tabel 1: Total Score, Percentage, Antrian, dll.
  autoTable(doc, {
    body: [
      [
        {
          content: "Percentage Service",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: row.percentage_service,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
      ],
      [
        {
          content: "Percentage Food",
          styles: {
            halign: "left",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
        {
          content: row.percentage_food,
          styles: {
            halign: "center",
            fillColor: [255, 223, 186],
            fontStyle: "bold",
          },
        },
      ],
    ],
    startY: summaryY,
    styles: { fontSize: 10, lineColor: [200, 200, 200], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 40 },
    },
    tableWidth: "wrap",
  });

  // Ambil posisi terakhir tabel pertama
  let newTableY = (doc as any).lastAutoTable.finalY + 0; // Tambah sedikit padding

  // Tabel 2: Catatan/Temuan, Penjelasan Complaint, Rekomendasi
  autoTable(doc, {
    body: [
      [
        {
          content: "Memo",
          styles: {
            halign: "left",
            fillColor: [240, 240, 240],
            fontStyle: "bold",
          },
        },
        { content: row["summary"] || "-", styles: { halign: "left" } },
      ],
    ],
    startY: newTableY,
    styles: { fontSize: 10, lineColor: [200, 200, 200], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 110 },
    },
    tableWidth: "wrap",
  });

  // Fungsi untuk menambahkan gambar setelah tabel
  const addImagesToPdf = (doc: jsPDF, images: { title: string; imageData: string }[], startY: number) => {
    console.log(images);
    let yPosition = startY;

    images.forEach((image, index) => {
      // Jika gambar melebihi batas bawah halaman, tambahkan halaman baru
      if (yPosition + 51 > doc.internal.pageSize.height) {
        doc.addPage();
        yPosition = 10;
      }

      // Menambahkan nomor gambar di sebelah kiri
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${image.title}`, 20, yPosition);
      yPosition += 5;

      // Menambahkan gambar di sebelah kanan
      const pageWidth = doc.internal.pageSize.width;
      doc.addImage(image.imageData, "JPEG", pageWidth - 100, yPosition - 10, 80, 90); // Menambahkan gambar di kanan
      yPosition += 93;
    });

    return yPosition;
  };

  // Ambil gambar dari database dan pastikan formatnya base64
  const images = [
    { title: "Image Product", imageData: row.image_product }, // Pastikan image_struk adalah base64
    { title: "Image Struk", imageData: row.image_struk }, // Pastikan image_product adalah base64
    { title: "Lainnya", imageData: row.image_lainnya }, // Pastikan image_lainnya adalah base64
  ];

  // Tambahkan gambar setelah tabel
  yPosition = addImagesToPdf(doc, images, yPosition + 200);

  try {
    doc.save(
      `${row.kode_gerai}_${new Date(row.createdAt)
        .toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "numeric",
          year: "numeric",
        })
        .replace(/\//g, "-")}_${row.store_name}_${row.area}.pdf`
    );
  } catch (error) {
    console.error("Error saat membuat PDF:", error);
  } finally {
    setLoading(false); // Set loading ke false setelah selesai
  }
};
