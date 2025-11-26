import {Instagram} from '~/components/icons';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white px-4 py-4">
      <div className="mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          {/* Left: Copyright */}
          <div className="text-xs uppercase tracking-wider text-black">
            © {currentYear} Bunker Studios Inc.
          </div>

          {/* Right: Instagram Link */}
          <a
            href="https://www.instagram.com/bunkerstudiosinc/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-black hover:opacity-70 transition-opacity"
            aria-label="Follow us on Instagram"
          >
            <Instagram size={24} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </footer>
  );
}
