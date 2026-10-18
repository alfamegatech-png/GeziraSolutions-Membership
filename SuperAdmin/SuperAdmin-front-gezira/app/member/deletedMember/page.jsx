"use client";
import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import React from "react";
import axios from "axios";
import Swal from "sweetalert2";

const Page = () => {
  const initialValues = {
    member_code: 0,
  };

  const validationSchema = Yup.object({
    member_code: Yup.string().required("رقم العضوية مطلوب"),
  });

  const onSubmit = (values, { resetForm }) => {
    console.log(values);
    resetForm();
  };

  const deleteMember = async (memberCode) => {
    try {
      const response = await axios.delete(
        `http://10.1.1.115:5000/api/delete-member/${memberCode}`
      );

      console.log("Member deleted:", response.data);

      Swal.fire({
        icon: "success",
        title: "تم حذف العضو بنجاح",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error("Error deleting member:", error);

      // Show error message
      Swal.fire({
        icon: "error",
        title: "حدث خطأ",
        text: "تم حذف العضو مسبقا او برجاء التأكد من البيانات",
      });
    }
  };

  return (
    <Box>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur }) => (
          <Form>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                mt: 5,
                p: 2,
                width: "50%",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "grey.400",
                mx: "auto",
                backgroundColor: "background.paper",
              }}
            >
              <Grid container spacing={2} sx={{ width: "75%" }}>
                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    component="label"
                    htmlFor="member_code"
                    color="textSecondary"
                    sx={{ mb: 1 }}
                  >
                    رقم العضوية <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    id="member_code"
                    name="member_code"
                    placeholder="رقم العضوية"
                    value={values.member_code}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.member_code && Boolean(errors.member_code)}
                    helperText={touched.member_code && errors.member_code}
                    variant="outlined"
                    margin="dense"
                    InputProps={{
                      className:
                        "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500",
                    }}
                  />
                </Grid>
              </Grid>

              <Button
                variant="success"
                className="btn btn-success "
                // style={{ backgroundColor: "#157347" }}
                sx={{
                  mt: 2,
                  width: "50%",
                  color: "white",
                  backgroundColor: "#15803D",
                  ":hover": {
                    backgroundColor: "#166534",
                  },
                }}
                onClick={() => deleteMember(values.member_code)}
              >
                حذف العضو
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default Page;
