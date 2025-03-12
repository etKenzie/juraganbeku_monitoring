import React from "react";
import { Box, FormControlLabel, Switch, Typography } from "@mui/material";
import { FieldProps } from "formik";

interface SwitchFieldProps extends FieldProps {
  label?: string;
}

const SwitchField: React.FC<SwitchFieldProps> = ({ field, form, label = "Status" }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.checked ? 1 : 0;
    form.setFieldValue(field.name, value);
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography>{label}</Typography>
      <Switch checked={field.value === 1} onChange={handleChange} />
    </Box>
  );
};

export default SwitchField;
