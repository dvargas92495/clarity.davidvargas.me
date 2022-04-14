import getMeta from "@dvargas92495/ui/utils/getMeta";
import { SignUp } from "@clerk/remix";
import remixAuthedLoader from "@dvargas92495/ui/utils/remixAuthedLoader.server";

export const loader = remixAuthedLoader;
export const meta = getMeta({ title: "Sign up" });
export default SignUp;
