import { useState, useEffect } from "react";

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener("resize", checkIsDesktop);

    checkIsDesktop();

    return () => {
      window.removeEventListener("resize", checkIsDesktop);
    };
  }, []);

  return isDesktop;
};

export default useIsDesktop;
