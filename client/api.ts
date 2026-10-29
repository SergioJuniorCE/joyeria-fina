import { createClient } from "lakebed/client";
import type app from "../server";

export const client = createClient<typeof app>();
