import { useFormikContext } from "formik";
import { Checkbox, FormGroup, FormLabel, FormControlLabel } from "@mui/material";

interface ChecklistFieldProps {
  name: string;
  label: string;
  options: string[];
}

const ChecklistField: React.FC<ChecklistFieldProps> = ({ name, label, options }) => {
  const { values, setFieldValue } = useFormikContext<any>();

  const selectedValues = values[name] ? values[name].split(", ") : [];

  return (
    <FormGroup>
      <FormLabel component="legend" sx={{ fontSize: "16px", fontWeight: "600" }}>
        {label}
      </FormLabel>
      {options.map((option) => (
        <FormControlLabel
          key={option}
          control={
            <Checkbox
              checked={selectedValues.includes(option)}
              onChange={(e) => {
                let newValues = [...selectedValues];
                if (e.target.checked) {
                  newValues.push(option);
                } else {
                  newValues = newValues.filter((item) => item !== option);
                }
                setFieldValue(name, newValues.join(", ")); // Simpan sebagai string
              }}
            />
          }
          label={option}
        />
      ))}
    </FormGroup>
  );
};

export default ChecklistField;
