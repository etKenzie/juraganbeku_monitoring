import React from "react";
import { FieldProps } from "formik";
import { Box, Button, Dialog, DialogContent, IconButton, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Close as CloseIcon } from "@mui/icons-material";

interface FileUploadProps extends FieldProps {
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ field, form, label = "Upload Image" }) => {
  const [preview, setPreview] = React.useState<string | null>(typeof field.value === "string" ? field.value : null);
  const [open, setOpen] = React.useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      form.setFieldValue(field.name, file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleRemove = () => {
    form.setFieldValue(field.name, "");
    setPreview(null);
  };

  return (
    <>
      {/* Upload Button */}
      <Typography sx={{ fontSize: "16px", fontWeight: "600" }}>{label}</Typography>

      {/* Preview Image & Remove Button */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Button variant="contained" component="label" sx={{ width: "120px", height: "45px" }}>
          <input type="file" hidden accept="image/*" onChange={handleChange} />
          <Typography>Upload File</Typography>
        </Button>
        {preview && (
          <Box mt={2} mb={2} display="flex" alignItems="center">
            <img src={preview} alt="Preview" style={{ width: "100px", height: "100px", objectFit: "cover", marginRight: "8px" }} onClick={() => setOpen(true)} />
            <IconButton onClick={handleRemove} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
        {/* Popup Image (Dialog) */}
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs">
          <DialogContent>
            <IconButton aria-label="close" onClick={() => setOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
            {preview && <img src={preview} alt="Full Preview" style={{ width: "100%", height: "auto" }} />}
          </DialogContent>
        </Dialog>
      </Box>
    </>
  );
};

export default FileUpload;
