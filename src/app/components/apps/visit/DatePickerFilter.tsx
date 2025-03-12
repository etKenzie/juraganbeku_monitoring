import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, parse } from "date-fns";
import { TextField } from "@mui/material";

interface DateFilterProps {
  label: string;
  value: string | null;
  onChange: (date: string | null) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ label, value, onChange }) => {
  // 🔹 Konversi `yyyy-MM-dd` ke `dd-MM-yyyy` untuk tampilan frontend
  const displayValue = value ? format(parse(value, "yyyy-MM-dd", new Date()), "dd-MM-yyyy") : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        label={label} // 🔹 Label dinamis dari props
        inputFormat="dd-MM-yyyy" // 🔹 Format tampilan di UI
        value={displayValue ? parse(displayValue, "dd-MM-yyyy", new Date()) : null} // 🔹 Konversi agar DatePicker bisa membaca
        onChange={(date: Date | null) => {
          if (date) {
            const backendFormat = format(date, "yyyy-MM-dd"); // 🔹 Format untuk backend
            onChange(backendFormat);
          } else {
            onChange(null);
          }
        }}
        renderInput={(params) => <TextField {...params} size="small" />}
      />
    </LocalizationProvider>
  );
};

export default DateFilter;
