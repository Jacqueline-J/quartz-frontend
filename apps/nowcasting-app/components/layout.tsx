import Head from "next/head";

import Footer from "./footer";
import Navbar from "./navbar";

interface ILayout {
  children: React.ReactNode;
  environment: "local" | "dev";
}

const Layout = ({ children, environment }: ILayout) => {
  return (
    <>
      <Head>
        <title>Nowcasting App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Navbar environment={environment} />
      <main>{children}</main>
      <Footer />
    </>
  );
};

export default Layout;
