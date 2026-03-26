export const onRequestGet: PagesFunction<{ ANTHROPIC_API_KEY: string }> = async () => {
  return Response.json({ status: 'ok', timestamp: Date.now() });
};
