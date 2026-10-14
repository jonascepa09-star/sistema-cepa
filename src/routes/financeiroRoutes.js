const express = require('express');
const router = express.Router();
const financeiroController = require('../controllers/financeiroController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/', roleMiddleware('SECRETARIA', 'COORDENACAO', 'ALUNO'), financeiroController.listar);
router.get('/kpis', roleMiddleware('SECRETARIA'), financeiroController.kpis);
router.post('/baixa/:id', roleMiddleware('SECRETARIA'), financeiroController.darBaixa);
router.get('/mensagem-cobranca/:id', roleMiddleware('SECRETARIA'), financeiroController.gerarMensagemWhatsApp);

module.exports = router;
