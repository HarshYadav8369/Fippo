import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Fippo - PDF and Document Conversion</title>
        <meta name="description" content="Convert, merge, and compress PDFs with ease" />
      </Head>

      <main>
        <h1 className="text-3xl font-bold text-center mt-8">
          Welcome to Fippo!
        </h1>
      </main>
    </div>
  );
}
