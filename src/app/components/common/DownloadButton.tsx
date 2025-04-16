import { downloadExcel } from "@/app/utils/excelDownload";
import { Download as DownloadIcon } from "@mui/icons-material";
import { Button } from "@mui/material";

interface DownloadButtonProps {
  data: any[];
  filename: string;
  sheetName?: string;
  variant?: "text" | "outlined" | "contained";
  color?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  size?: "small" | "medium" | "large";
}

const DownloadButton = ({
  data,
  filename,
  sheetName,
  variant = "contained",
  color = "primary",
  size = "medium"
}: DownloadButtonProps) => {
  const handleDownload = () => {
    downloadExcel(data, { filename, sheetName });
  };

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      startIcon={<DownloadIcon />}
      onClick={handleDownload}
    >
      Download Excel
    </Button>
  );
};

export default DownloadButton; 