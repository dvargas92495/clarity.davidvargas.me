const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./app/**/*.tsx", "./node_modules/@dvargas92495/ui/**/*.js"],
  theme: {
    extend: {},
    colors: {
      'clarity': {
        50: '#fbf7f8',
        100: "#ebe4e6",
        200: '#e3dee0',
        300: "#765a6924",
      },
      ...colors,
    }
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
};
