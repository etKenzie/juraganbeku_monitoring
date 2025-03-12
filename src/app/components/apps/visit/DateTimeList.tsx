import { format, parseISO } from "date-fns";
import { Field } from "formik";
import { TextField } from "@mui/material";

const formatDateTime = (dateTime: string | null) => {
  if (!dateTime) return "";
  return format(parseISO(dateTime), "HH:mm:ss");
};

const DateTimeField = ({ name, label }: { name: string; label: string }) => (
  <Field name={name}>
    {({ field }: { field: any }) => (
      <TextField
        {...field}
        fullWidth
        margin="normal"
        label={label}
        value={field.value ? formatDateTime(field.value) : ""}
        InputProps={{ readOnly: true }} // Supaya user tidak bisa edit langsung
      />
    )}
  </Field>
);

export default DateTimeField;
