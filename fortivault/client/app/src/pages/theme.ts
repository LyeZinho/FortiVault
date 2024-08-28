// theme.js
import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "light", // or 'dark'
  useSystemColorMode: false, // Set to true to use the user's OS preference
};

const theme = extendTheme({ config });

export default theme;