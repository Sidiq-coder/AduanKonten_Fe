"use client";
import { useTheme } from "next-themes@0.4.6";
import { Toaster as Sonner } from "sonner@2.0.3";

const toastBaseClasses = [
    "group",
    "toast",
    "group-[.toaster]:bg-white",
    "group-[.toaster]:text-[#0F172A]",
    "group-[.toaster]:border",
    "group-[.toaster]:border-[#C8D9F4]",
    "group-[.toaster]:shadow-[0_25px_60px_rgba(2,15,40,0.25)]",
    "group-[.toaster]:rounded-2xl",
    "group-[.toaster]:px-5",
    "group-[.toaster]:py-4",
    "group-[.toaster]:gap-2",
    "group-[.toaster]:min-w-[320px]",
    "group-[.toaster]:max-w-[420px]",
    "group-[.toaster]:font-semibold",
].join(" ");

const Toaster = ({ ...props }) => {
    const { theme = "system" } = useTheme();
    return (<Sonner theme={theme} className="toaster group" style={{
            "--normal-bg": "var(--popover)",
            "--normal-text": "var(--popover-foreground)",
            "--normal-border": "var(--border)",
        }} toastOptions={{
            duration: 7000,
            className: toastBaseClasses,
            descriptionClassName: "text-sm font-normal text-[#475569]",
            actionButtonStyle: {
                background: "#003D82",
                color: "#fff",
                borderRadius: "9999px",
                paddingInline: "1rem",
                fontWeight: 600,
            },
            cancelButtonStyle: {
                background: "transparent",
                color: "#003D82",
                border: "1px solid rgba(0,61,130,0.3)",
                borderRadius: "9999px",
                fontWeight: 600,
            },
        }} richColors closeButton {...props}/>);
};
export { Toaster };
