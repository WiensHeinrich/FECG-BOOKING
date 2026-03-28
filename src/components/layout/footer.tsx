import { siteConfig } from "@/lib/config/site";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center text-sm text-muted-foreground md:flex-row md:justify-between md:text-left">
          <p>&copy; {new Date().getFullYear()} {siteConfig.church}</p>
          <p>
            Bei Fragen:{" "}
            <a
              href="mailto:freizeit@fecg-trossingen.de"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              freizeit@fecg-trossingen.de
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
