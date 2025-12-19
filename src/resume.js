import Resolver from '@forge/resolver';
import { sql } from '@forge/sql';
import crypto from 'crypto';
import api, { route } from "@forge/api";


const resolver = new Resolver();

import addresume from "./resolvers/addresume.js";
import updateresume from "./resolvers/updateresume.js";

import updateaction from "./resolvers/updateaction.js";
import deleteresume from "./resolvers/deleteresume.js";
import reputationcatalog from "./resolvers/reputationcatalog.js";
import reputationcatalogsave from './resolvers/reputationcatalogsave.js';
import getreputation from './resolvers/getreputation.js';
import assignreputation from './resolvers/assignreputation.js';
import getuserstories from './resolvers/getuserstories.js';
import addreferrer from './resolvers/addreferrer.js';
import getcurrentissue from "./resolvers/getcurrentissue.js";
import findcandidates from "./resolvers/findcandidates.js";
import checkuser from "./resolvers/checkuser.js";
import searchskills from "./resolvers/searchskills.js";
import invitation from "./resolvers/invitation.js";
import checkresumebyemail from "./resolvers/checkresumebyemail";
import getinvitations from "./resolvers/getinvitations";
import sendpriceproposal from "./resolvers/sendpriceproposal";
import getrfppropmanager from "./resolvers/getrfppropmanager";
import getalldatafrontend from "./resolvers/getalldatafrontend";
import passsend from "./resolvers/passsend";

resolver.define("addresume", async (args) =>
  addresume({ ...args, sql })
);

resolver.define("updateresume", async (args) =>
  updateresume({ ...args, sql })
);

resolver.define("updateaction", async (args) =>
  updateaction({ ...args, sql })
);

resolver.define("deleteresume", async (args) =>
  deleteresume({ ...args, sql })
);

resolver.define("reputationcatalog", async (args) =>
  reputationcatalog({ ...args, sql })
);

resolver.define("reputationcatalogsave", async (args) =>
  reputationcatalogsave({ ...args, sql })
);

resolver.define("getreputation", async (args) =>
  getreputation({ sql })
);

resolver.define("assignreputation", async (args) =>
  assignreputation({ ...args, sql })
);

resolver.define("getuserstories", async (args) =>
  getuserstories({ sql, api, route })
);

resolver.define("addreferrer", async (args) =>
  addreferrer({ ...args, sql })
);

resolver.define("getcurrentissue", async (args) =>
  getcurrentissue({ ...args, context: args.context })
);


resolver.define("findcandidates", async (args) =>
  findcandidates({ ...args, sql })
);

resolver.define("checkuser", async (args) =>
  checkuser({ context: args.context })
);

resolver.define("searchskills", async (args) =>
  searchskills({ ...args, sql })
);

resolver.define("invitation", async (args) =>
  invitation({ ...args, sql })
);

resolver.define("checkresumebyemail", async (args) =>
  checkresumebyemail({ ...args, sql})
);

resolver.define("getinvitations", async (args) =>
  getinvitations({ ...args, sql })
);

resolver.define("sendpriceproposal", async (args) =>
  sendpriceproposal({ ...args, sql })
);

resolver.define("getrfppropmanager", async (args) =>
  getrfppropmanager({ ...args, sql })
);


resolver.define("getalldatafrontend", async (args) =>
  getalldatafrontend({ ...args, sql })
);

resolver.define("passsend", async (args) =>
  passsend({ ...args, sql })
);

export const handler = resolver.getDefinitions();
