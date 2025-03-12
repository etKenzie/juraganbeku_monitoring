import { Field } from "formik";
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";

interface RadioFieldProps {
  name: string;
  label: string;
  options: { value: number; label: string }[];
  defaultValue?: number;
}

const RadioField: React.FC<RadioFieldProps> = ({ name, label, options, defaultValue }) => (
  <Field name={name}>
    {({ field, form }: { field: any; form: any }) => (
      <FormControl component="fieldset" fullWidth margin="normal">
        <FormLabel component="legend" sx={{ fontSize: "16px", fontWeight: "600" }}>
          {label}
        </FormLabel>
        <RadioGroup {...field} value={field.value ?? defaultValue} onChange={(event) => form.setFieldValue(name, Number(event.target.value))}>
          {options.map((option) => (
            <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
          ))}
        </RadioGroup>
      </FormControl>
    )}
  </Field>
);

export default RadioField;
