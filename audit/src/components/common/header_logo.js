import Image from "next/image";
import Link from "next/link";

export default function HeaderLogo() {
  return (
    <div className="mr-2">
      <Link href={"/m"} className="hidden md:block w-[0px] md:w-[40px] flex-shrink-0">
        <Image src={"/logo.jpg"} width={45} height={45} alt={"jobboard"} />
      </Link>
      <Link href={"/m"} className="hidden sm:block md:hidden w-[0px] sm:w-[40px] md:w-[0px] flex-shrink-0">
        <Image src={"/logo.jpg"} width={45} height={45} alt={"jobboard"} />
      </Link>
    </div>
  );
}
