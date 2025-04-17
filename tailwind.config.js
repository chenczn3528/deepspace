// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }


/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      textShadow: {
        // 自定义阴影样式
        white: '2px 2px 4px rgba(255, 255, 255, 0.8)', // 白色边框
        black: '2px 2px 4px rgba(0, 0, 0, 0.8)', // 黑色边框
        gold: '2px 2px 4px rgba(255, 223, 0, 0.8)', // 金色边框
        // 可以添加更多自定义的阴影
      },
    },
  },
  plugins: [
    require('tailwindcss-textshadow'), // 添加 text-shadow 插件
  ],
}
