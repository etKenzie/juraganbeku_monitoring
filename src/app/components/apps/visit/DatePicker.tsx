import { Field, useFormikContext } from "formik";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, parse } from "date-fns";
import idLocale from "date-fns/locale/id"; // Bahasa Indonesia
import { TextField } from "@mui/material";

interface DateFieldProps {
  name: string;
  label: string;
}

const DateField = ({ name, label }: DateFieldProps) => {
  const { setFieldValue, values } = useFormikContext<{ [key: string]: string }>();

  // Konversi dari format database (YYYY-MM-DD HH:mm:ss) ke Date object
  const parsedValue = values[name] ? new Date(values[name]) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={idLocale}>
      <DatePicker
        label={label}
        value={parsedValue}
        onChange={(date) => {
          setFieldValue(name, date instanceof Date ? format(date, "yyyy-MM-dd") : ""); // Simpan dalam format database
        }}
        renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
      />
    </LocalizationProvider>
  );
};

export default DateField;
