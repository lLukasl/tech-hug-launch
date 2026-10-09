<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Catalog products live in the `products` table; photos in a private `product-photos` bucket served via signed URLs (workspace blocks public buckets).
- Staff roles live in `user_roles` (superadmin/member, `active` flag); account creation/deactivation goes through server functions in `src/lib/admin.functions.ts` that verify superadmin first.
