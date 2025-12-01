import Resolver from '@forge/resolver';
import { sql } from '@forge/sql';
import crypto from 'crypto';
import api, { route } from "@forge/api";


const resolver = new Resolver();

import addresume from "./resolvers/addresume.js";
import updateresume from "./resolvers/updateresume.js";

import updateAction from "./resolvers/updateaction.js";
import deleteResume from "./resolvers/deleteresume.js";
import reputationCatalog from "./resolvers/reputationcatalog.js";
import reputationcatalogsave from './resolvers/reputationcatalogsave.js';
import getreputation from './resolvers/getreputation.js';
import assignreputation from './resolvers/assignreputation.js';
import getuserstories from './resolvers/getuserstories.js';
import addreferrer from './resolvers/addreferrer.js';
import getcurrentissue from "./resolvers/getcurrentissue.js";
import findcandidates from "./resolvers/findcandidates.js";

resolver.define("addresume", async (args) =>
  addresume({ ...args, sql })
);

resolver.define("updateresume", async (args) =>
  updateresume({ ...args, sql })
);

resolver.define("updateaction", async (args) =>
  updateAction({ ...args, sql })
);

resolver.define("deleteresume", async (args) =>
  deleteResume({ ...args, sql })
);

resolver.define("reputationcatalog", async (args) =>
  reputationCatalog({ ...args, sql })
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


export const handler = resolver.getDefinitions();
