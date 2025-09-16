import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

// Swagger definition
const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'TeddyBackEnd API',
    version: '1.0.0',
    description: 'Comprehensive expense tracking and group financial management API',
    contact: {
      name: 'API Support',
      email: 'support@teddy-backend.com'
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server'
    },
    {
      url: '',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication'
      }
    },
    schemas: {
      User: {
        type: 'object',
        required: ['name', 'email', 'role'],
        properties: {
          _id: {
            type: 'string',
            description: 'User ID'
          },
          name: {
            type: 'string',
            description: 'User full name'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            description: 'User role'
          },
          isDeleted: {
            type: 'boolean',
            description: 'Whether user is deleted'
          }
        }
      },
      Profile: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Profile ID'
          },
          user_id: {
            type: 'string',
            description: 'Associated user ID'
          },
          profileImage: {
            type: 'string',
            description: 'Profile image URL'
          },
          preferredCurrency: {
            type: 'string',
            enum: ['USD', 'EUR', 'SGD', 'GBP', 'AUD'],
            description: 'User preferred currency'
          },
          language: {
            type: 'string',
            enum: ['en', 'id', 'ms', 'ko', 'zh', 'ja'],
            description: 'User preferred language'
          }
        }
      },
      GroupTransaction: {
        type: 'object',
        required: ['groupId', 'groupName', 'ownerEmail'],
        properties: {
          groupId: {
            type: 'number',
            description: 'Unique group identifier'
          },
          groupName: {
            type: 'string',
            description: 'Group name'
          },
          ownerEmail: {
            type: 'string',
            format: 'email',
            description: 'Group owner email'
          },
          groupMembers: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email'
            },
            description: 'Array of member emails'
          },
          financialSummary: {
            type: 'object',
            properties: {
              youllPay: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    memberEmail: {
                      type: 'string',
                      format: 'email'
                    },
                    currency: {
                      type: 'string',
                      enum: ['USD', 'EUR', 'SGD', 'GBP', 'AUD']
                    },
                    amount: {
                      type: 'number'
                    }
                  }
                }
              },
              youllCollect: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    memberEmail: {
                      type: 'string',
                      format: 'email'
                    },
                    currency: {
                      type: 'string',
                      enum: ['USD', 'EUR', 'SGD', 'GBP', 'AUD']
                    },
                    amount: {
                      type: 'number'
                    }
                  }
                }
              },
              netBalance: {
                type: 'object',
                properties: {
                  amount: {
                    type: 'number'
                  },
                  status: {
                    type: 'string',
                    enum: ['you_owe', 'you_are_owed', 'settled_up']
                  },
                  currency: {
                    type: 'string',
                    enum: ['USD', 'EUR', 'SGD', 'GBP', 'AUD']
                  }
                }
              }
            }
          }
        }
      },
      Transaction: {
        type: 'object',
        required: ['amount', 'currency', 'transactionType'],
        properties: {
          _id: {
            type: 'string',
            description: 'Transaction ID'
          },
          amount: {
            type: 'number',
            description: 'Transaction amount'
          },
          currency: {
            type: 'string',
            enum: ['USD', 'EUR', 'SGD', 'GBP', 'AUD'],
            description: 'Transaction currency'
          },
          originalAmount: {
            type: 'number',
            description: 'Original amount before currency conversion'
          },
          originalCurrency: {
            type: 'string',
            enum: ['USD', 'EUR', 'SGD', 'GBP', 'AUD'],
            description: 'Original currency before conversion'
          },
          transactionType: {
            type: 'string',
            enum: ['income', 'expense'],
            description: 'Type of transaction'
          },
          description: {
            type: 'string',
            description: 'Transaction description'
          },
          date: {
            type: 'string',
            format: 'date-time',
            description: 'Transaction date'
          },
          type_id: {
            type: 'string',
            description: 'Transaction type ID'
          },
          isGroupTransaction: {
            type: 'boolean',
            description: 'Whether this is a group transaction'
          }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['success', 'fail', 'error'],
            description: 'Response status'
          },
          data: {
            type: 'object',
            description: 'Response data'
          },
          message: {
            type: 'string',
            description: 'Response message'
          },
          currencyNote: {
            type: 'string',
            description: 'Currency conversion note (if applicable)'
          }
        }
      },
      Error: {
        type: 'object',
        required: ['status', 'message'],
        properties: {
          status: {
            type: 'string',
            enum: ['fail', 'error']
          },
          message: {
            type: 'string',
            description: 'Error message'
          },
          stack: {
            type: 'string',
            description: 'Error stack trace (development only)'
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/modules/**/*.ts',
    './src/modules/**/routes/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export default specs;