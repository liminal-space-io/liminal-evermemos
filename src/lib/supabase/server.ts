/** Stub Supabase server client */

function createStubQuery() {
  const query: any = {
    from: () => query,
    select: () => query,
    insert: () => query,
    update: () => query,
    upsert: () => query,
    delete: () => query,
    eq: () => query,
    neq: () => query,
    order: () => query,
    limit: () => query,
    single: () => Promise.resolve({ data: null as any, error: null as any }),
    then: (resolve: any) => resolve({ data: null as any, error: null as any }),
  }
  return query
}

export function getServiceSupabase() {
  const client = createStubQuery()
  client.auth = { getUser: () => Promise.resolve({ data: { user: null }, error: null }) }
  return client
}
