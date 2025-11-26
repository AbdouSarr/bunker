import {Instagram} from '~/components/icons';

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-b border-black py-8">
      <div className="flex items-center justify-center">
        {/* Centered Instagram Link */}
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
    </footer>
  );
}
