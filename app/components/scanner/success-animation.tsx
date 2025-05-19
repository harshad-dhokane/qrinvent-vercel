/*this orginal code*/

/* 
import Lottie from "lottie-react";
import successfullScanAnimation from "../../lottie/success-scan.json";

export default function SuccessAnimation() {
  return (
    <Lottie
      animationData={successfullScanAnimation}
      loop={false}
      style={{ width: 200, height: 200 }}
    />
  );
} */

/*this copiolot agent 1*/
/* import Lottie from "lottie-react";
  import { ClientOnly } from "remix-utils/client-only";
  import successfullScanAnimation from "../../lottie/success-scan.json";
  
  export default function SuccessAnimation() {
    return (
      <ClientOnly fallback={null}>
        {() => (
          <Lottie
            animationData={successfullScanAnimation}
            loop={false}
            style={{ width: 200, height: 200 }}
          />
        )}
      </ClientOnly>
    );
  } */

/*this copiolot agent 2*/
import React, { lazy, Suspense } from "react";
import successfullScanAnimation from "../../lottie/success-scan.json";
const Lottie = lazy(() => import("lottie-react"));

export default function SuccessAnimation() {
  return (
    <Suspense fallback={<div>Loading animation...</div>}>
      <Lottie
        animationData={successfullScanAnimation}
        loop={false}
        style={{ width: 200, height: 200 }}
      />
    </Suspense>
  );
}
