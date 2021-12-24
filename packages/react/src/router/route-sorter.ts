type Route = {
  path: string;
  isContainer?: boolean;
  children?: Route[];
  index?: boolean;
};

export class RoutePathNode<T extends Route> {
  placeholder = true;
  children: Map<string, RoutePathNode<T>> = new Map();
  slugName: string | null = null;
  restSlugName: string | null = null;
  optionalRestSlugName: string | null = null;
  route: T;

  insertRoute(route: T): void {
    let routePath = route.path;
    if (route.index) {
      routePath = routePath + (routePath.endsWith("/") ? "$index" : "/$index");
    }

    this._insert(route, routePath.split("/").filter(Boolean), [], false);
  }

  insertRoutes(routes: T[]): void {
    for (const route of routes) {
      this.insertRoute(route);
    }
  }

  smooth(): T[] {
    return this._smoosh();
  }

  private _smoosh(prefix = "/"): T[] {
    const childrenPaths = [...this.children.keys()].sort();
    if (this.slugName !== null) {
      childrenPaths.splice(childrenPaths.indexOf("[]"), 1);
    }
    if (this.restSlugName !== null) {
      childrenPaths.splice(childrenPaths.indexOf("[...]"), 1);
    }
    if (this.optionalRestSlugName !== null) {
      childrenPaths.splice(childrenPaths.indexOf("[[...]]"), 1);
    }
    let routes: T[] = [];
    const childrenRoutes = childrenPaths.map((c) => this.children.get(c)!._smoosh(`${prefix}${c}/`)).reduce((prev, curr) => [...prev, ...curr], []);

    if (this.slugName !== null) {
      childrenRoutes.push(...this.children.get("[]")!._smoosh(`${prefix}:${this.slugName}/`));
    }

    if (this.restSlugName !== null) {
      childrenRoutes.push(...this.children.get("[...]")!._smoosh(`${prefix}:${this.restSlugName}+/`));
    }

    if (this.optionalRestSlugName !== null) {
      childrenRoutes.push(...this.children.get("[[...]]")!._smoosh(`${prefix}:${this.optionalRestSlugName}*/`));
    }

    if (!this.placeholder) {
      const r = prefix === "/" ? "/" : prefix.slice(0, -1);
      if (this.optionalRestSlugName != null) {
        throw new Error(
          `You cannot define a route with the same specificity as a optional catch-all route ("${r}" and "${r}:${this.optionalRestSlugName}*").`
        );
      }
      if (this.route.isContainer) {
        this.route.children = childrenRoutes;
        routes.push(this.route);
      } else {
        routes.push(this.route, ...childrenRoutes);
      }
    } else {
      routes = childrenRoutes;
    }

    return routes;
  }

  private _insert(route: T, routePaths: string[], slugNames: string[], isCatchAll: boolean): void {
    if (routePaths.length === 0) {
      this.placeholder = false;
      this.route = route;
      return;
    }

    if (isCatchAll) {
      throw new Error(`Catch-all must be the last part of the URL.`);
    }

    // The next segment in the routePaths list
    let nextSegment = routePaths[0];

    // Check if the segment matches `[something]`
    if (nextSegment.startsWith(":")) {
      let isOptional = false;
      // Strip `：` , leaving only `something`
      let segmentName = nextSegment.slice(1);
      if (segmentName.endsWith("?")) {
        isOptional = true;
        // Strip optional `?`, leaving only `something`
        segmentName = segmentName.slice(0, -1);
      } else if (segmentName.endsWith("+")) {
        isCatchAll = true;
        segmentName = segmentName.slice(0, -1);
      } else if (segmentName.endsWith("*")) {
        isOptional = true;
        isCatchAll = true;
        segmentName = segmentName.slice(0, -1);
      }

      if (/[\*\?\:]/.test(segmentName)) {
        throw new Error(`Segment names may not includes special character ('${segmentName}').`);
      }

      const handleSlug = (previousSlug: string | null, nextSlug: string) => {
        if (previousSlug !== null) {
          // If the specific segment already has a slug but the slug is not `something`
          // This prevents collisions like:
          // pages/[post]/index.js
          // pages/[id]/index.js
          // Because currently multiple dynamic params on the same segment level are not supported
          if (previousSlug !== nextSlug) {
            // TODO: This error seems to be confusing for users, needs an err.sh link, the description can be based on above comment.
            throw new Error(`You cannot use different slug names for the same dynamic path ('${previousSlug}' !== '${nextSlug}').`);
          }
        }

        slugNames.forEach((slug) => {
          if (slug === nextSlug) {
            throw new Error(`You cannot have the same slug name "${nextSlug}" repeat within a single dynamic path`);
          }

          if (slug.replace(/\W/g, "") === nextSegment.replace(/\W/g, "")) {
            throw new Error(
              `You cannot have the slug names "${slug}" and "${nextSlug}" differ only by non-word symbols within a single dynamic path`
            );
          }
        });

        slugNames.push(nextSlug);
      };

      if (isCatchAll) {
        if (isOptional) {
          if (this.restSlugName != null) {
            throw new Error(
              `You cannot use both an required and optional catch-all route at the same level (":${this.restSlugName}+" and "${routePaths[0]}" ).`
            );
          }

          handleSlug(this.optionalRestSlugName, segmentName);
          // slugName is kept as it can only be one particular slugName
          this.optionalRestSlugName = segmentName;
          // nextSegment is overwritten to [[...]] so that it can later be sorted specifically
          nextSegment = "[[...]]";
        } else {
          if (this.optionalRestSlugName != null) {
            throw new Error(
              `You cannot use both an optional and required catch-all route at the same level (":${this.optionalRestSlugName}*" and "${routePaths[0]}").`
            );
          }

          handleSlug(this.restSlugName, segmentName);
          // slugName is kept as it can only be one particular slugName
          this.restSlugName = segmentName;
          // nextSegment is overwritten to [...] so that it can later be sorted specifically
          nextSegment = "[...]";
        }
      } else {
        if (isOptional) {
          throw new Error(`Optional route parameters are not yet supported ("${routePaths[0]}").`);
        }
        handleSlug(this.slugName, segmentName);
        // slugName is kept as it can only be one particular slugName
        this.slugName = segmentName;
        // nextSegment is overwritten to [] so that it can later be sorted specifically
        nextSegment = "[]";
      }
    }

    // If this RoutePathNode doesn't have the nextSegment yet we create a new child RoutePathNode
    if (!this.children.has(nextSegment)) {
      this.children.set(nextSegment, new RoutePathNode());
    }

    this.children.get(nextSegment)!._insert(route, routePaths.slice(1), slugNames, isCatchAll);
  }
}

export function getSortedRoutes(normalizedPages: string[]): string[] {
  // First the RoutePathNode is created, and every RoutePathNode can have only 1 dynamic segment
  // Eg you can't have pages/[post]/abc.js and pages/[hello]/something-else.js
  // Only 1 dynamic segment per nesting level

  // So in the case that is test/integration/dynamic-routing it'll be this:
  // pages/[post]/comments.js
  // pages/blog/[post]/comment/[id].js
  // Both are fine because `pages/[post]` and `pages/blog` are on the same level
  // So in this case `RoutePathNode` created here has `this.slugName === 'post'`
  // And since your PR passed through `slugName` as an array basically it'd including it in too many possibilities
  // Instead what has to be passed through is the upwards path's dynamic names
  const root = new RoutePathNode();

  // Here the `root` gets injected multiple paths, and insert will break them up into sublevels
  normalizedPages.forEach((pagePath) => root.insertRoute({ path: pagePath }));
  // Smoosh will then sort those sublevels up to the point where you get the correct route definition priority
  return root.smooth().map((r) => r.path);
}
