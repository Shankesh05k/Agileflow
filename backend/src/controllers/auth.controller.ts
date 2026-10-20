import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../db/pool';
import { generateTokens } from '../middleware/auth';
import { User, JwtPayload } from '../types';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await queryOne<User & { password_hash: string }>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } = generateTokens(payload);

    // Store refresh token hash
    const hash = await bcrypt.hash(refreshToken, 8);
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, hash]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_initials: user.avatar_initials,
        avatar_color: user.avatar_color,
      },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as { refreshToken: string };
  if (!refreshToken) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret'
    ) as JwtPayload;
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  // Verify stored token
  const stored = await query<{ token_hash: string; id: string }>(
    `SELECT id, token_hash FROM refresh_tokens
     WHERE user_id = $1 AND expires_at > NOW()`,
    [payload.sub]
  );

  let matched = false;
  for (const row of stored) {
    if (await bcrypt.compare(refreshToken, row.token_hash)) {
      matched = true;
      // Rotate: delete old, issue new
      await query('DELETE FROM refresh_tokens WHERE id = $1', [row.id]);
      break;
    }
  }

  if (!matched) {
    res.status(401).json({ error: 'Refresh token not recognised' });
    return;
  }

  const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  };
  const tokens = generateTokens(newPayload);

  const newHash = await bcrypt.hash(tokens.refreshToken, 8);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [payload.sub, newHash]
  );

  res.json(tokens);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await queryOne<User>(
    'SELECT id, email, name, role, avatar_initials, avatar_color FROM users WHERE id = $1',
    [req.user!.sub]
  );
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(user);
}
