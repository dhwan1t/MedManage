import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle() {
    const { isDark, setIsDark } = useTheme()

    return (
        <button
            onClick={() => setIsDark(!isDark)}
            className="
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
        transition-all duration-200 border
        dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700
        bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200
      "
        >
            {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
    )
}
