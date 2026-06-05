import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Image src="/logo-cropped.png" alt="HireVault" width={120} height={28} className="h-7 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all" />
          </div>
          
          <div className="flex gap-8 text-sm text-zinc-500 font-medium">
            <Link href="#" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-zinc-900 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-zinc-900 transition-colors">Contact</Link>
          </div>
        </div>
        
        <div className="mt-8 text-center md:text-left text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} HireVault. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
