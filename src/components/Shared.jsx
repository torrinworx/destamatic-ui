import { OObject } from "destam-dom"
import Theme from "./Theme"
import Router from "./Router";

// A simple way to have a standard shared object acrross destamatic-ui
const Shared = OObject({
    Theme: Theme,
    Router: Router
})

export default Shared;
