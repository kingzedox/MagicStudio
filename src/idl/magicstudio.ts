export const IDL = 
{
  "address": "5nRcojZxaqi3SYd4qBUdD8NzYPEBbWHUkbcHAACY23A2",
  "metadata": {
    "name": "magicstudio",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "MagicCanvas: Real-Time AI Co-Design on Solana using MagicBlock Ephemeral Rollups"
  },
  "instructions": [
    {
      "name": "batch_update",
      "docs": [
        "Updates up to 8 elements in a single transaction.",
        "",
        "This is the AI layout generation instruction — when the frontend",
        "calls /api/generate, the returned elements are applied to the canvas",
        "in a single atomic transaction for instant rendering.",
        "",
        "Also used for initial canvas setup and bulk operations."
      ],
      "discriminator": [
        57,
        189,
        226,
        20,
        239,
        33,
        98,
        191
      ],
      "accounts": [
        {
          "name": "canvas_state",
          "docs": [
            "The delegated canvas PDA. Writable inside the ER."
          ],
          "writable": true
        },
        {
          "name": "authority",
          "docs": [
            "The user performing the update. In production, this would be",
            "validated against a session key from @magicblock-labs/session-keys."
          ],
          "signer": true
        }
      ],
      "args": [
        {
          "name": "updates",
          "type": {
            "vec": {
              "defined": {
                "name": "CanvasElement"
              }
            }
          }
        }
      ]
    },
    {
      "name": "delegate",
      "docs": [
        "Delegates the CanvasState PDA to the MagicBlock Ephemeral Rollup.",
        "",
        "After this instruction:",
        "- The account is writable inside the ER (sub-10ms latency)",
        "- The account is read-only on Solana L1",
        "- All subsequent `update_element` calls go through the ER RPC",
        "",
        "The `#[delegate]` attribute macro auto-injects the CPI to the",
        "MagicBlock delegation program, handling account locking and",
        "JIT (Just-In-Time) state cloning to the ephemeral validator."
      ],
      "discriminator": [
        90,
        147,
        75,
        178,
        85,
        88,
        4,
        137
      ],
      "accounts": [
        {
          "name": "canvas_state",
          "docs": [
            "The canvas PDA to delegate. Must be mutable for the delegation CPI."
          ],
          "writable": true
        },
        {
          "name": "payer",
          "docs": [
            "The authority/payer signing the delegation transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "docs": [
            "Required by the delegation CPI."
          ],
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "owner_program",
          "address": "5nRcojZxaqi3SYd4qBUdD8NzYPEBbWHUkbcHAACY23A2"
        },
        {
          "name": "delegation_program",
          "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
        }
      ],
      "args": []
    },
    {
      "name": "initialize_canvas",
      "docs": [
        "Creates a new canvas room on the Solana base layer.",
        "The PDA is derived from seeds: [\"canvas\", room_id].",
        "After initialization, call `delegate` to enter the ER session."
      ],
      "discriminator": [
        223,
        91,
        237,
        137,
        41,
        27,
        240,
        59
      ],
      "accounts": [
        {
          "name": "canvas_state",
          "docs": [
            "The canvas state PDA, derived from [\"canvas\", room_id].",
            "Space calculation:",
            "8 (discriminator) + 32 (authority) + 4+32 (room_id String) +",
            "2 (version) + 1 (element_count) + 16 * 12 (elements array) = 271 bytes"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  110,
                  118,
                  97,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "room_id"
              }
            ]
          }
        },
        {
          "name": "authority",
          "docs": [
            "The wallet paying for account creation and signing the transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "docs": [
            "Required by Anchor for account initialization."
          ],
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "room_id",
          "type": "string"
        }
      ]
    },
    {
      "name": "process_undelegation",
      "discriminator": [
        196,
        28,
        41,
        206,
        48,
        37,
        51,
        167
      ],
      "accounts": [
        {
          "name": "base_account",
          "writable": true
        },
        {
          "name": "buffer"
        },
        {
          "name": "payer",
          "writable": true
        },
        {
          "name": "system_program"
        }
      ],
      "args": [
        {
          "name": "account_seeds",
          "type": {
            "vec": "bytes"
          }
        }
      ]
    },
    {
      "name": "publish_and_undelegate",
      "docs": [
        "Commits the final state and undelegates the account from the ER.",
        "",
        "After this instruction:",
        "- The canvas state is finalized on Solana L1",
        "- Account ownership returns to this program",
        "- The ER session for this account is terminated",
        "- Standard Solana transactions can modify the account again",
        "",
        "Uses `MagicIntentBundleBuilder` to atomically commit state and",
        "release delegation in a single operation."
      ],
      "discriminator": [
        11,
        73,
        76,
        148,
        172,
        246,
        78,
        185
      ],
      "accounts": [
        {
          "name": "canvas_state",
          "docs": [
            "The delegated canvas PDA to commit/undelegate."
          ],
          "writable": true
        },
        {
          "name": "payer",
          "docs": [
            "The authority signing the commit transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "magic_program",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magic_context",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "remove_element",
      "docs": [
        "Removes an element by zeroing out its slot in the fixed array.",
        "Runs inside the ER at sub-10ms latency."
      ],
      "discriminator": [
        15,
        89,
        74,
        184,
        137,
        163,
        36,
        225
      ],
      "accounts": [
        {
          "name": "canvas_state",
          "docs": [
            "The delegated canvas PDA. Writable inside the ER."
          ],
          "writable": true
        },
        {
          "name": "authority",
          "docs": [
            "The user performing the update. In production, this would be",
            "validated against a session key from @magicblock-labs/session-keys."
          ],
          "signer": true
        }
      ],
      "args": [
        {
          "name": "element_id",
          "type": "u8"
        }
      ]
    },
    {
      "name": "save_version_snapshot",
      "docs": [
        "Commits the current canvas state back to Solana L1 as a version snapshot.",
        "",
        "This is a NON-DESTRUCTIVE commit: the account remains delegated to",
        "the ER and continues to accept high-speed mutations. The state on L1",
        "is updated to reflect the latest version.",
        "",
        "Use this for periodic checkpoints during a live co-design session",
        "(e.g., after an AI layout generation or a significant edit batch).",
        "",
        "The `#[commit]` attribute macro auto-injects the necessary accounts",
        "and CPI logic for the MagicBlock commitment flow."
      ],
      "discriminator": [
        216,
        132,
        178,
        50,
        64,
        84,
        120,
        114
      ],
      "accounts": [
        {
          "name": "canvas_state",
          "docs": [
            "The delegated canvas PDA to commit/undelegate."
          ],
          "writable": true
        },
        {
          "name": "payer",
          "docs": [
            "The authority signing the commit transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "magic_program",
          "address": "Magic11111111111111111111111111111111111111"
        },
        {
          "name": "magic_context",
          "writable": true,
          "address": "MagicContext1111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "update_element",
      "docs": [
        "Updates a single canvas element's properties.",
        "",
        "This instruction runs inside the MagicBlock Ephemeral Rollup at",
        "sub-10ms latency with zero gas costs. It is the core real-time",
        "collaboration primitive — called every time a user moves, resizes,",
        "or modifies an element on the canvas.",
        "",
        "Transactions should be sent to the MagicBlock ER RPC endpoint",
        "(https://devnet.magicblock.app) with `{ skipPreflight: true }`.",
        "",
        "Element types:",
        "0 = Rectangle",
        "1 = Text",
        "2 = Image"
      ],
      "discriminator": [
        216,
        199,
        35,
        123,
        11,
        151,
        116,
        61
      ],
      "accounts": [
        {
          "name": "canvas_state",
          "docs": [
            "The delegated canvas PDA. Writable inside the ER."
          ],
          "writable": true
        },
        {
          "name": "authority",
          "docs": [
            "The user performing the update. In production, this would be",
            "validated against a session key from @magicblock-labs/session-keys."
          ],
          "signer": true
        }
      ],
      "args": [
        {
          "name": "element_id",
          "type": "u8"
        },
        {
          "name": "element_type",
          "type": "u8"
        },
        {
          "name": "x",
          "type": "u16"
        },
        {
          "name": "y",
          "type": "u16"
        },
        {
          "name": "w",
          "type": "u16"
        },
        {
          "name": "h",
          "type": "u16"
        },
        {
          "name": "color_rgb",
          "type": {
            "array": [
              "u8",
              3
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "CanvasState",
      "discriminator": [
        64,
        117,
        74,
        242,
        207,
        52,
        148,
        249
      ]
    }
  ],
  "events": [
    {
      "name": "BatchUpdated",
      "discriminator": [
        142,
        123,
        95,
        53,
        37,
        90,
        159,
        254
      ]
    },
    {
      "name": "ElementRemoved",
      "discriminator": [
        189,
        34,
        235,
        213,
        97,
        39,
        198,
        216
      ]
    },
    {
      "name": "ElementUpdated",
      "discriminator": [
        54,
        255,
        65,
        142,
        194,
        201,
        63,
        222
      ]
    },
    {
      "name": "VersionCommitted",
      "discriminator": [
        6,
        64,
        184,
        200,
        254,
        60,
        78,
        7
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "RoomIdTooLong",
      "msg": "Room ID must be 32 characters or fewer"
    },
    {
      "code": 6001,
      "name": "InvalidElementType",
      "msg": "Element type must be 0 (Rect), 1 (Text), or 2 (Image)"
    },
    {
      "code": 6002,
      "name": "ElementIdOutOfBounds",
      "msg": "Element ID must be between 0 and 15"
    },
    {
      "code": 6003,
      "name": "BatchTooLarge",
      "msg": "Batch update cannot exceed 8 elements"
    }
  ],
  "types": [
    {
      "name": "BatchUpdated",
      "docs": [
        "Emitted when a batch of elements is updated (AI layout generation)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "room_id",
            "type": "string"
          },
          {
            "name": "count",
            "type": "u8"
          },
          {
            "name": "editor",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "CanvasElement",
      "docs": [
        "A single element on the canvas (rectangle, text, or image placeholder).",
        "",
        "Packed into 12 bytes per element for efficient on-chain storage:",
        "1 (id) + 1 (type) + 2*4 (x,y,w,h) + 3 (color) = 13 bytes"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "docs": [
              "Element ID (1-indexed). 0 = empty/unused slot."
            ],
            "type": "u8"
          },
          {
            "name": "element_type",
            "docs": [
              "Element type: 0 = Rectangle, 1 = Text, 2 = Image."
            ],
            "type": "u8"
          },
          {
            "name": "x",
            "docs": [
              "X position on the canvas (pixels)."
            ],
            "type": "u16"
          },
          {
            "name": "y",
            "docs": [
              "Y position on the canvas (pixels)."
            ],
            "type": "u16"
          },
          {
            "name": "w",
            "docs": [
              "Width of the element (pixels)."
            ],
            "type": "u16"
          },
          {
            "name": "h",
            "docs": [
              "Height of the element (pixels)."
            ],
            "type": "u16"
          },
          {
            "name": "color_rgb",
            "docs": [
              "RGB color as [R, G, B] bytes (0-255 each)."
            ],
            "type": {
              "array": [
                "u8",
                3
              ]
            }
          }
        ]
      }
    },
    {
      "name": "CanvasState",
      "docs": [
        "The on-chain state for a single canvas room.",
        "",
        "PDA seeds: [\"canvas\", room_id.as_bytes()]",
        "",
        "This account lives on Solana L1 when not delegated, and inside the",
        "MagicBlock Ephemeral Rollup when delegated. The fixed-size element",
        "array avoids reallocation overhead during high-frequency ER updates."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "The wallet that created this canvas and has admin privileges."
            ],
            "type": "pubkey"
          },
          {
            "name": "room_id",
            "docs": [
              "Human-readable room identifier (e.g., \"blitz-2026\")."
            ],
            "type": "string"
          },
          {
            "name": "version",
            "docs": [
              "Monotonically increasing version counter.",
              "Incremented on each L1 commit (save_version_snapshot / publish_and_undelegate)."
            ],
            "type": "u16"
          },
          {
            "name": "element_count",
            "docs": [
              "Number of active elements on the canvas (0..MAX_ELEMENTS)."
            ],
            "type": "u8"
          },
          {
            "name": "elements",
            "docs": [
              "Fixed array of canvas elements. Unused slots have id=0.",
              "Fixed size is critical for ER performance — avoids dynamic allocation."
            ],
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "CanvasElement"
                  }
                },
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "ElementRemoved",
      "docs": [
        "Emitted when an element is removed from the canvas."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "room_id",
            "type": "string"
          },
          {
            "name": "element_id",
            "type": "u8"
          },
          {
            "name": "editor",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "ElementUpdated",
      "docs": [
        "Emitted when a single element is created or modified.",
        "Frontend uses this to sync canvas state across all connected users."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "room_id",
            "type": "string"
          },
          {
            "name": "element_id",
            "type": "u8"
          },
          {
            "name": "element_type",
            "type": "u8"
          },
          {
            "name": "x",
            "type": "u16"
          },
          {
            "name": "y",
            "type": "u16"
          },
          {
            "name": "w",
            "type": "u16"
          },
          {
            "name": "h",
            "type": "u16"
          },
          {
            "name": "color_rgb",
            "type": {
              "array": [
                "u8",
                3
              ]
            }
          },
          {
            "name": "editor",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "VersionCommitted",
      "docs": [
        "Emitted when a version is committed to L1.",
        "`is_final` is true when the session is also undelegated."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "room_id",
            "type": "string"
          },
          {
            "name": "version",
            "type": "u16"
          },
          {
            "name": "element_count",
            "type": "u8"
          },
          {
            "name": "is_final",
            "type": "bool"
          }
        ]
      }
    }
  ]
};
export type MagicStudio = typeof IDL;
