import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Treat all warnings we care about as surfaced by CI by failing on warnings via the npm script
      // Shadcn usage nudges
      "no-restricted-syntax": [
        "warn",
        {
          selector: "JSXOpeningElement[name.name='button']",
          message:
            "Prefer <Button /> from @/components/ui/button (shadcn). If you need a native <button>, add a disable rule comment explaining why.",
        },
        {
          selector: "JSXOpeningElement[name.name='table']",
          message:
            "Prefer shadcn table primitives: { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from @/components/ui/table.",
        },
      ],
    },
  },
  // Disable this rule for shadcn primitives where native elements are expected.
  {
    files: ["components/ui/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
];

export default eslintConfig;
