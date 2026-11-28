export const metadata = { title: 'About' };
export default function About() {
  return (
    <div className="container-x max-w-3xl pt-12">
      <h1 className="h1 mb-8">About the studio</h1>
      <div className="space-y-5 text-bone/80">
        <p>Black Frame Studio is an independent horror game studio. We make games built on atmosphere, tension and restraint.</p>
        <p>Our first project is <strong className="text-bone">NIGHT SHIFT</strong>, currently in development. Follow the studio for announcements and pre-registration news.</p>
      </div>
    </div>
  );
}
