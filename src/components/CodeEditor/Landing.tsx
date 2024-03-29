// Landing.tsx

import React, { useEffect, useState } from "react";
import CodeEditorWindow from "./CodeEditorWindow";
import { languageOptions } from "./constants/languageOptions";
import { defineTheme } from "./lib/defineTheme";
import useKeyPress from "./hooks/useKeyPress";
import OutputWindow from "./OutputWindow";
import CustomInput from "./CustomInput";
import ThemeDropdown from "./ThemeDropdown";
import LanguagesDropdown from "./LanguageDropdown";
// Import the Snackbar and Alert components from MUI
import {
  Snackbar,
  Alert,
  Box,
  Stack,
  Button,
  Typography,
  Paper,
} from "@mui/material";
import { OutputDetailsProps } from "./interface/OutputDetailsProps";
import OutputDetails from "./OutputDetails";
import {
  GetExampleLanguageCode,
  ExampleCode,
} from "./utils/getExampleLanguageCode";
import {
  compileCode,
  checkStatus,
  FormData,
  encodeBase64,
} from "./utils/codeApi";

const example_codes = GetExampleLanguageCode();

const Landing: React.FC = () => {
  const [code, setCode] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [outputDetails, setOutputDetails] = useState<OutputDetailsProps>(null);
  const [exampleCodes, setExampleCodes] = useState<ExampleCode[] | null>(
    example_codes
  );

  const [processing, setProcessing] = useState(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [language, setLanguage] = useState<any | null>(languageOptions[0]);

  const enterPress = useKeyPress("Enter");
  const ctrlPress = useKeyPress("Control");

  const onSelectChange = (sl: any) => {
    console.log("selected Option...", sl);
    setLanguage(sl);
  };

  useEffect(() => {
    if (exampleCodes) {
      const exampleCode = exampleCodes.filter(
        (ec) => ec.language_id === language?.id
      );
      if (exampleCode.length > 0) {
        setCode(exampleCode[0].code);
      }
    }
    console.log("code", code);
  }, [language, exampleCodes]);

  useEffect(() => {
    if (enterPress && ctrlPress) {
      console.log("enterPress", enterPress);
      console.log("ctrlPress", ctrlPress);
      handleCompile();
    }
  }, [ctrlPress, enterPress]);
  const onChange = (action: string, data: string) => {
    switch (action) {
      case "code": {
        setCode(data);
        break;
      }
      default: {
        console.warn("case not handled!", action, data);
      }
    }
  };

  const handleCompile = () => {
    setProcessing(true);

    // Create the form data object
    const formData: FormData = {
      language_id: language?.id,
      // encode source code in base64
      source_code: encodeBase64(code),
      stdin: encodeBase64(customInput),
    };

    // Send the request and handle the response
    compileCode(formData)
      .then(function (response: any) {
        console.log("res.data", response.data);
        const token = response.data.token;
        checkStatusLanding(token);
      })
      .catch((err) => {
        let error = err.response ? err.response.data : err;
        setProcessing(false);
        // Added an error catching structure here
        // Show an error message to the user
        showErrorSnackbar(
          `An error occurred while sending the request. Please try again.`
        );
        // Log the error details to the console
        console.error(`Error details: ${error.message}`);
      });
  };

  // Define a function to check the status of the request
  const checkStatusLanding = async (token: string) => {
    var timeoutId: number;
    try {
      // Send the request and get the response
      let response: any = await checkStatus(token);
      let statusId: number = response.data.status_id;
      console.log("statusId", statusId);
      // Processed - we have a result
      if (statusId === 3) {
        setProcessing(false);
        setOutputDetails(response.data);
        showSuccessSnackbar(`Compiled Successfully!`);
        console.log("response.data", response.data);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        return;
      } else if (statusId === 1 || statusId === 2) {
        // Still processing or error
        setTimeout(() => {
          checkStatusLanding(token);
        }, 2000);
        return;
      } else {
        setProcessing(false);
        setOutputDetails(response.data);
        showErrorSnackbar(`Something went wrong! Please try again.`);
        console.log("response.data", response.data);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        return;
      }
    } catch (err) {
      setProcessing(false);
      // Added an error catching structure here
      // Show an error message to the user
      showErrorSnackbar(
        `An error occurred while checking the status. Please try again.`
      );
      // Log the error details to the console
      console.error(`Error details: ${err.message}`);
    }
  };

  // Define the theme type
  type Theme = {
    value: string;
    label: string;
  };

  function handleThemeChange(th: Theme) {
    const theme = th;
    console.log("theme...", theme);

    if (["light", "vs-dark"].includes(theme.value)) {
      setTheme(theme);
    } else {
      defineTheme(theme.value).then((_) => setTheme(theme));
    }
  }

  useEffect(() => {
    defineTheme("oceanic-next").then((_) =>
      setTheme({ value: "oceanic-next", label: "Oceanic Next" })
    );
  }, []);

  // Define a state for the snackbar open status
  const [open, setOpen] = React.useState(false);

  // Define a state for the snackbar message
  const [message, setMessage] = React.useState("");

  // Define a state for the snackbar severity
  const [severity, setSeverity] = React.useState<"success" | "error">(
    "success"
  );

  // Define a state for the snackbar position
  const [position, setPosition] = React.useState({
    vertical: "top",
    horizontal: "center",
  });

  // Define a function to show a success snackbar
  const showSuccessSnackbar = (msg?: string) => {
    setMessage(msg || `Compiled Successfully!`);
    setSeverity("success");
    setOpen(true);
    setPosition({ vertical: "top", horizontal: "center" });
  };

  // Define a function to show an error snackbar
  const showErrorSnackbar = (msg?: string) => {
    setMessage(msg || `Something went wrong! Please try again.`);
    setSeverity("error");
    setOpen(true);
    setPosition({ vertical: "top", horizontal: "center" });
  };

  // Define a function to handle the snackbar close event
  const handleClose = (
    event: React.SyntheticEvent | MouseEvent,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  // Render the snackbar component with the alert component inside
  <Snackbar
    open={open}
    autoHideDuration={5000}
    onClose={handleClose}
    key={position.vertical + position.horizontal}
  >
    <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
      {message}
    </Alert>
  </Snackbar>;

  return (
    <>
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        key={position.vertical + position.horizontal}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
      <Typography
        variant="h2"
        sx={{
          textAlign: "center",
          mt: 4,
          fontWeight: "bold",
          textShadow: "2px 2px 0px rgba(0,0,0,0.2)",
        }}
      >
        Basic Code Editor
      </Typography>
      <Paper // using Paper component
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "95%",
          margin: "auto",
          padding: 3,
          borderRadius: 3,
          boxShadow: 3,
        }}
      >
        <Stack
          direction="row"
          px={4}
          py={4}
          left={0}
          right={0}
          sx={{
            "@media (max-width: 600px)": {
              flexDirection: "column",
              alignItems: "center",
            },
          }}
        >
          <LanguagesDropdown onSelectChange={onSelectChange} />
          <ThemeDropdown handleThemeChange={handleThemeChange} theme={theme} />
        </Stack>
        <Stack
          direction="row"
          px={4}
          py={4}
          alignItems="start"
          sx={{
            "@media (max-width: 900px)": {
              flexDirection: "column",
              alignItems: "center",
              display: "contents",
            },
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "start",
            }}
          >
            <CodeEditorWindow
              code={code}
              onChange={onChange}
              language={language?.value}
              theme={theme?.value}
            />
          </Box>

          <Box
            sx={{
              flexShrink: 0,
              width: "30%",
              marginLeft: 4,
              display: "flex",
              flexDirection: "column",
              "@media (max-width: 900px)": {
                width: "100%",
                ml: 0,
              },
            }}
          >
            <OutputWindow {...outputDetails} />
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {/* <CustomInput
              customInput={customInput}
              setCustomInput={setCustomInput}
            /> */}
              <Button
                onClick={handleCompile}
                disabled={!code || processing}
                sx={{
                  mt: 4,
                  border: 2,
                  borderColor: "black",
                  zIndex: 10,
                  borderRadius: "md",
                  boxShadow: "5px 5px 0px 0px rgba(0,0,0)",
                  px: 4,
                  py: 2,
                  "&.hover": {
                    boxShadow: "none",
                  },
                  transition: "duration-200",
                  bgcolor: "white",
                  flexShrink: 0,
                  opacity: !code ? 0.5 : 1,
                }}
              >
                {processing ? "Processing..." : "Compile and Execute"}
              </Button>
            </Box>
            {outputDetails && <OutputDetails {...outputDetails} />}
          </Box>
        </Stack>
      </Paper>
    </>
  );
};
export default Landing;
