import { ImageWithFallback } from "./ImageWithFallback";
import logoUnila from "figma:asset/d34d985ddede35cae5fdbc22432bf5a9475c5a08.png";
export function UnilaLogo({ className = "", size = 48 }) {
    return (<ImageWithFallback src={logoUnila} alt="Logo Universitas Lampung" width={size} height={size} className={`object-contain ${className}`} style={{ width: `${size}px`, height: `${size}px` }}/>);
}
