import { Field } from "formik";
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";

interface RadioFieldProps {
  name: string;
  label: string;
}

const RadioField = ({ name, label }: RadioFieldProps) => (
  <Field name={name}>
    {({ field, form }: { field: any; form: any }) => (
      <FormControl component="fieldset" fullWidth margin="normal">
        <FormLabel component="legend" sx={{ fontSize: "16px", fontWeight: "600" }}>
          {label}
        </FormLabel>
        <RadioGroup row {...field} value={field.value === "Yes" ? "Yes" : "No"} onChange={(event) => form.setFieldValue(name, event.target.value)}>
          <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
          <FormControlLabel value="No" control={<Radio />} label="No" />
        </RadioGroup>
      </FormControl>
    )}
  </Field>
);

export default RadioField;
