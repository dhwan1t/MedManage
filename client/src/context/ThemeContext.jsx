import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(true)

    useEffect(() => {
        const root = document.documentElement
        if (isDark) {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
    }, [isDark])

    return (
        <ThemeContext.Provider value={{ isDark, setIsDark }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
